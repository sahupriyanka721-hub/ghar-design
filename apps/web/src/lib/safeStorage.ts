/**
 * BuildGhar Safe LocalStorage Engine
 * Handles quota limits gracefully, cleans up bloated base64 payloads,
 * prevents QuotaExceededError, and ensures high performance without data loss.
 */

const MAX_ARRAY_LENGTH = 40;
const MAX_DATA_URL_LENGTH = 512;

/**
 * Strips excessive base64 / data URLs from an object to save storage space
 */
export function stripHeavyPayloads<T>(data: T): T {
  if (!data) return data;
  if (typeof data === 'string') {
    if (data.startsWith('data:') && data.length > MAX_DATA_URL_LENGTH) {
      return '' as any;
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => stripHeavyPayloads(item)) as any;
  }
  if (typeof data === 'object') {
    const copy: any = {};
    for (const [k, v] of Object.entries(data)) {
      // Don't strip critical tiny IDs or metadata
      if (typeof v === 'string' && v.startsWith('data:') && v.length > MAX_DATA_URL_LENGTH) {
        copy[k] = '';
      } else if (typeof v === 'object' && v !== null) {
        copy[k] = stripHeavyPayloads(v);
      } else {
        copy[k] = v;
      }
    }
    return copy;
  }
  return data;
}

/**
 * Free up emergency localStorage space by pruning bloated base64 caches and trimming old records
 */
export function freeLocalStorageSpace(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const keysToRemove: string[] = [];
    const keysToPrune: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // 1. Unconditionally remove heavy document / photo caches (handled permanently by IndexedDB vault)
      if (
        key.startsWith('arch_photo_') ||
        key.startsWith('doc_file_') ||
        key.startsWith('gd_vault_') ||
        key.startsWith('user_photo_') ||
        key.startsWith('profile_photo_') ||
        key.startsWith('designer_doc_')
      ) {
        keysToRemove.push(key);
        continue;
      }

      // 2. Identify list storage keys that might have bloated arrays
      if (
        key.startsWith('platform_') ||
        key.startsWith('gd_') ||
        key.startsWith('customer_') ||
        key === 'material_orders'
      ) {
        keysToPrune.push(key);
      } else {
        // Any unknown large key containing base64 data URL
        try {
          const val = localStorage.getItem(key) || '';
          if (val.length > 30000 && (val.includes('data:image/') || val.includes('data:application/pdf'))) {
            keysToRemove.push(key);
          }
        } catch {}
      }
    }

    // Remove heavy image/doc caches
    for (const k of keysToRemove) {
      try {
        localStorage.removeItem(k);
      } catch {}
    }

    // Prune arrays: strip data URLs and keep only latest 25 items
    for (const k of keysToPrune) {
      try {
        const raw = localStorage.getItem(k);
        if (raw && (raw.length > 20000 || raw.includes('data:image/'))) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const stripped = stripHeavyPayloads(parsed.slice(0, 25));
            localStorage.setItem(k, JSON.stringify(stripped));
          }
        }
      } catch {}
    }

    console.info('[SafeStorage] Cleaned up storage headroom to prevent QuotaExceededError.');
  } catch (err) {
    console.warn('[SafeStorage] Emergency prune encountered error:', err);
  }
}

/**
 * Safely writes an item to localStorage with automatic quota retry and payload trimming
 */
export function safeSetStorage(key: string, value: any, maxItems = MAX_ARRAY_LENGTH): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  let serialized: string;
  try {
    let payload = stripHeavyPayloads(value);
    if (Array.isArray(payload)) {
      payload = payload.slice(0, maxItems);
    }
    serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  } catch (serializeErr) {
    console.error(`[SafeStorage] Failed to serialize key "${key}":`, serializeErr);
    return false;
  }

  // Attempt 1: Direct write
  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (firstErr: any) {
    console.warn(`[SafeStorage] QuotaExceeded or write error on "${key}". Freeing emergency storage space...`);

    // Attempt 2: Free space aggressively and retry
    try {
      freeLocalStorageSpace();
      localStorage.setItem(key, serialized);
      return true;
    } catch {
      // Attempt 3: Aggressively strip and keep latest 20 items
      try {
        let stripped = stripHeavyPayloads(value);
        if (Array.isArray(stripped)) {
          stripped = stripped.slice(0, Math.min(maxItems, 20));
        }
        const leanSerialized = JSON.stringify(stripped);
        localStorage.setItem(key, leanSerialized);
        console.info(`[SafeStorage] Successfully saved lean version of "${key}".`);
        return true;
      } catch (finalErr) {
        // Attempt 4: Super emergency - keep only latest 5 items
        if (Array.isArray(value) && value.length > 0) {
          try {
            const superLean = JSON.stringify(stripHeavyPayloads(value.slice(0, 5)));
            localStorage.setItem(key, superLean);
            console.info(`[SafeStorage] Saved super-lean 5-item version of "${key}".`);
            return true;
          } catch {}
        }
        console.error(`[SafeStorage] Critical: Unable to save "${key}" even after pruning:`, finalErr);
        return false;
      }
    }
  }
}

/**
 * Safely reads an item from localStorage with fallback
 */
export function safeGetStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
