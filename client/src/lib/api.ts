export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const authTokenKey = 'airroster_token';

export function getAuthToken() {
  return window.localStorage.getItem(authTokenKey);
}

export function setAuthToken(token: string | null) {
  if (token) {
    window.localStorage.setItem(authTokenKey, token);
  } else {
    window.localStorage.removeItem(authTokenKey);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText })) as { error?: string };
    throw new ApiError(response.status, body.error ?? response.statusText);
  }
  return response.json() as Promise<T>;
}

export function post<T>(path: string, body?: unknown) {
  return api<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
}

export function put<T>(path: string, body?: unknown) {
  return api<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) });
}

export function del<T>(path: string) {
  return api<T>(path, { method: 'DELETE' });
}
