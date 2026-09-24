const API_BASE = import.meta.env.VITE_API_URL ?? "";

type ApiOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  _skipRefresh?: boolean;
};

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: () => void;
  reject: (err: Error) => void;
}> = [];

function onRefreshSuccess() {
  refreshQueue.forEach(({ resolve }) => resolve());
  refreshQueue = [];
}

function onRefreshFailure(err: Error) {
  refreshQueue.forEach(({ reject }) => reject(err));
  refreshQueue = [];
}

async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, _skipRefresh = false } = options;

  const fetchOptions: RequestInit = {
    method,
    credentials: "include",
    headers: { ...headers },
  };

  if (body !== undefined) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      "Content-Type": "application/json",
    };
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, fetchOptions);

  if (res.status === 401 && !_skipRefresh) {
    let refreshed = false;

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        refreshed = await doRefresh();
        if (refreshed) {
          onRefreshSuccess();
        } else {
          onRefreshFailure(new Error("Session expired"));
        }
      } catch (err) {
        onRefreshFailure(err as Error);
      } finally {
        isRefreshing = false;
      }
    } else {
      try {
        await new Promise<void>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        });
        refreshed = true;
      } catch {
        refreshed = false;
      }
    }

    if (refreshed) {
      return request<T>(path, { ...options, _skipRefresh: true });
    }

    const err = new Error("Session expired. Please sign in again.");
    (err as any).code = "SESSION_EXPIRED";
    (err as any).status = 401;
    throw err;
  }

  if (!res.ok) {
    let message = "Something went wrong.";
    let code = "UNKNOWN_ERROR";
    try {
      const data = await res.json();
      if (data.error?.message) {
        message = data.error.message;
        code = data.error.code ?? code;
      } else if (data.message) {
        message = data.message;
      }
    } catch {
    }
    const err = new Error(message);
    (err as any).code = code;
    (err as any).status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json();

  if (json && typeof json === "object" && "success" in json && json.data !== undefined) {
    return json.data as T;
  }

  return json as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
