const DEFAULT_RENDER_API = 'https://ghar-design-api.onrender.com';
const API_BASE = import.meta.env.VITE_API_URL
  ? `${(import.meta.env.VITE_API_URL as string).replace(/\/$/, '')}/api/v1`
  : (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? `${DEFAULT_RENDER_API}/api/v1`
      : '/api/v1');

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string }> {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || 'Something went wrong';
      throw new Error(errorMsg);
    }

    return data;
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err.message);
    throw err;
  }
}
