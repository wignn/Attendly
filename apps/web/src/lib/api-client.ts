import { ApiResponse } from "@komas/shared-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const body: ApiResponse<T> = await res.json();

  if (!res.ok || !body.success) {
    throw new ApiError(
      body.error?.code || "UNKNOWN_ERROR",
      body.error?.message || body.message || "Something went wrong",
      body.error?.details
    );
  }

  return body.data as T;
}
