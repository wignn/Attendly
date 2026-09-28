import { ApiResponse, PaginationMeta } from "@komas/shared-types";

function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const trimmed = envUrl.replace(/\/+$/, "");
  // If NEXT_PUBLIC_API_URL has /api/v1 suffix, strip it because endpoints supply /api/v1
  if (trimmed.endsWith("/api/v1")) {
    return trimmed.slice(0, -"/api/v1".length);
  }
  return trimmed;
}

const API_BASE_URL = getBaseUrl();

let refreshPromise: Promise<string | null> | null = null;

async function requestTokenRefresh(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const url = `${API_BASE_URL}/api/v1/auth/refresh`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        throw new Error("Refresh failed");
      }

      const json = await res.json();
      if (!json.success || !json.data?.access_token) {
        throw new Error("Invalid refresh response");
      }

      const newAccessToken = json.data.access_token as string;
      const newRefreshToken = (json.data.refresh_token as string) || refreshToken;

      localStorage.setItem("token", newAccessToken);
      localStorage.setItem("refresh_token", newRefreshToken);
      return newAccessToken;
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("attendly_user");
      localStorage.setItem("attendly_is_auth", "false");
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Array<{ field: string; issue: string }>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface PaginatedResult<T> {
  data: T;
  meta?: PaginationMeta;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Tidak dapat terhubung ke server backend. Pastikan server aktif di " + API_BASE_URL
    );
  }

  if (res.status === 401 && !endpoint.includes("/auth/")) {
    const refreshedToken = await requestTokenRefresh();
    if (refreshedToken) {
      headers.set("Authorization", `Bearer ${refreshedToken}`);
      try {
        res = await fetch(url, {
          ...options,
          headers,
        });
      } catch (err: any) {
        throw new ApiError(
          "NETWORK_ERROR",
          "Tidak dapat terhubung ke server backend. Pastikan server aktif di " + API_BASE_URL
        );
      }
    }
  }

  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiError(`HTTP_${res.status}`, `HTTP error ${res.status}: ${res.statusText}`);
    }
    return {} as T;
  }

  if (!res.ok || !body.success) {
    throw new ApiError(
      body.error?.code || `HTTP_${res.status}`,
      body.error?.message || body.message || "Terjadi kesalahan saat memproses permintaan",
      body.error?.details
    );
  }

  return body.data as T;
}

export async function fetchPaginatedApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<PaginatedResult<T>> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Tidak dapat terhubung ke server backend. Pastikan server aktif di " + API_BASE_URL
    );
  }

  if (res.status === 401 && !endpoint.includes("/auth/")) {
    const refreshedToken = await requestTokenRefresh();
    if (refreshedToken) {
      headers.set("Authorization", `Bearer ${refreshedToken}`);
      try {
        res = await fetch(url, { ...options, headers });
      } catch {
        throw new ApiError(
          "NETWORK_ERROR",
          "Tidak dapat terhubung ke server backend. Pastikan server aktif di " + API_BASE_URL
        );
      }
    }
  }

  let body: ApiResponse<T>;
  try {
    body = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiError(`HTTP_${res.status}`, `HTTP error ${res.status}: ${res.statusText}`);
    }
    return { data: {} as T };
  }

  if (!res.ok || !body.success) {
    throw new ApiError(
      body.error?.code || `HTTP_${res.status}`,
      body.error?.message || body.message || "Terjadi kesalahan saat memproses permintaan",
      body.error?.details
    );
  }

  return {
    data: body.data as T,
    meta: body.meta,
  };
}

