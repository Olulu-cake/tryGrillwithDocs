import { getToken } from './auth';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const getCartId = () => {
  if (typeof window !== 'undefined') {
    let cartId = localStorage.getItem('guest_cart_id');
    if (!cartId) {
      cartId = crypto.randomUUID();
      localStorage.setItem('guest_cart_id', cartId);
    }
    document.cookie = `cartId=${cartId}; path=/; max-age=31536000; SameSite=Lax`;
    return cartId;
  }
  return 'server-guest-cart';
};

export async function apiFetchRaw(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const path = endpoint.startsWith('http') ? endpoint : (endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`);
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  
  const token = getToken();
  const cartId = getCartId();

  const headers = {
    'Content-Type': 'application/json',
    'x-cart-id': cartId,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };
  
  return fetch(url, {
    ...options,
    headers: headers as HeadersInit,
    credentials: 'include',
  });
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetchRaw(endpoint, options);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // Handle empty or 204 No Content responses
  if (response.status === 204) return {} as T;

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const fetchApi = apiFetch;
