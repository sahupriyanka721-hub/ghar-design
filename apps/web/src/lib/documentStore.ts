/**
 * BuildGhar Original Document Vault (IndexedDB Engine)
 *
 * Provides unlimited, high-performance permanent storage for user-uploaded
 * original documents (PDFs, scans, KYC images, cancelled cheques, certificates).
 *
 * Solves the 5MB browser LocalStorage quota limitation by utilizing IndexedDB,
 * ensuring all original uploaded documents are safely preserved and accurately
 * rendered and downloadable in the Admin panel.
 */

export interface StoredDocument {
  key: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

const DB_NAME = 'BuildGharDocumentVault';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

// In-memory cache for fast synchronous access
const memoryCache = new Map<string, StoredDocument>();

function openDocDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('Failed to open IndexedDB BuildGharDocumentVault:', request.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB initialization failed:', err);
      resolve(null);
    }
  });
}

/**
 * Save an original uploaded File into IndexedDB Document Vault
 */
export async function saveOriginalFile(key: string, file: File): Promise<StoredDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const storedDoc: StoredDocument = {
        key,
        name: file.name,
        type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };

      // 1. Cache in memory
      memoryCache.set(key, storedDoc);

      // 2. Persist in IndexedDB
      try {
        const db = await openDocDB();
        if (db) {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(storedDoc);
        }
      } catch (idbErr) {
        console.warn('Could not persist to IndexedDB:', idbErr);
      }

      resolve(storedDoc);
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Save an original Data URL directly into IndexedDB Document Vault
 */
export async function saveOriginalDataUrl(
  key: string,
  dataUrl: string,
  fileName: string,
  fileType = 'application/pdf',
  fileSize = 0
): Promise<StoredDocument> {
  const storedDoc: StoredDocument = {
    key,
    name: fileName,
    type: fileType,
    size: fileSize,
    dataUrl,
    uploadedAt: new Date().toISOString(),
  };

  memoryCache.set(key, storedDoc);

  try {
    const db = await openDocDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(storedDoc);
    }
  } catch (idbErr) {
    console.warn('Could not persist to IndexedDB:', idbErr);
  }

  return storedDoc;
}

/**
 * Retrieve an original document from IndexedDB or cache
 */
export async function getOriginalFile(key: string): Promise<StoredDocument | null> {
  if (!key) return null;

  // 1. Check memory cache
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!;
  }

  // 2. Check IndexedDB
  try {
    const db = await openDocDB();
    if (db) {
      const doc = await new Promise<StoredDocument | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });

      if (doc && doc.dataUrl) {
        memoryCache.set(key, doc);
        return doc;
      }
    }
  } catch (err) {
    console.warn('Error reading from IndexedDB:', err);
  }

  // 3. Check fallback in localStorage
  try {
    const raw = localStorage.getItem(`gd_vault_${key}`) ||
                localStorage.getItem(`doc_file_${key}`);
    if (raw) {
      if (raw.startsWith('data:')) {
        const doc: StoredDocument = {
          key,
          name: `${key}.pdf`,
          type: raw.startsWith('data:image') ? 'image/jpeg' : 'application/pdf',
          size: Math.round(raw.length * 0.75),
          dataUrl: raw,
          uploadedAt: new Date().toISOString(),
        };
        memoryCache.set(key, doc);
        return doc;
      }
      const parsed = JSON.parse(raw);
      if (parsed && parsed.dataUrl) {
        memoryCache.set(key, parsed);
        return parsed;
      }
    }
  } catch {}

  return null;
}

/**
 * Synchronously check in-memory cache or localStorage for instant rendering
 */
export function getOriginalFileSync(key: string): StoredDocument | null {
  if (!key) return null;
  if (memoryCache.has(key)) return memoryCache.get(key)!;

  try {
    const raw = localStorage.getItem(`gd_vault_${key}`) ||
                localStorage.getItem(`doc_file_${key}`);
    if (raw) {
      if (raw.startsWith('data:')) {
        const doc: StoredDocument = {
          key,
          name: `${key}.pdf`,
          type: raw.startsWith('data:image') ? 'image/jpeg' : 'application/pdf',
          size: Math.round(raw.length * 0.75),
          dataUrl: raw,
          uploadedAt: new Date().toISOString(),
        };
        memoryCache.set(key, doc);
        return doc;
      }
      const parsed = JSON.parse(raw);
      if (parsed && parsed.dataUrl) {
        memoryCache.set(key, parsed);
        return parsed;
      }
    }
  } catch {}

  return null;
}

/**
 * Trigger immediate client-side download of an original document file
 */
export function downloadOriginalDocument(
  doc: { name?: string; type?: string; dataUrl: string },
  fallbackName = 'Original_Document.pdf'
): boolean {
  try {
    if (!doc.dataUrl || doc.dataUrl === '#') return false;

    const fileName = doc.name || fallbackName;
    const a = document.createElement('a');
    a.href = doc.dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error('Failed to trigger file download:', err);
    return false;
  }
}
