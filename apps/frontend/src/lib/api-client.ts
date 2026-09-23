/**
 * Base API client for communicating with the backend REST API.
 * In development, Vite proxies /api to the backend server (see vite.config.ts),
 * so we use relative URLs. In production with same-domain deployment, this
 * also works as-is. For different-domain deployments, set VITE_API_URL.
 */
const API_BASE = import.meta.env.VITE_API_URL ?? "";

type ApiOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const fetchOptions: RequestInit = {
    method,
    credentials: "include", // send httpOnly cookies
    headers: {
      ...headers,
    },
  };

  if (body !== undefined) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      "Content-Type": "application/json",
    };
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, fetchOptions);

  if (!res.ok) {
    let message = "Something went wrong.";
    try {
      const data = await res.json();
      message = data.message ?? message;
    } catch {
      // response wasn't JSON
    }
    throw new Error(message);
  }

  // Handle empty responses (204 No Content)
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
