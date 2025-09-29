const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

type ApiError = Error & { status?: number };

// Attempt to parse a JSON payload while gracefully handling empty bodies.
async function parseJsonSafely(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.warn('Failed to parse API response as JSON', error);
    return null;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await parseJsonSafely(response);

  if (!response.ok) {
    const error: ApiError = new Error(
      (data as { message?: string } | null)?.message ?? 'Request failed'
    );
    error.status = response.status;
    throw error;
  }

  return data as T;
}

export type ApiUser = {
  id: string;
  email: string;
};

export const API_BASE_URL = API_URL;
