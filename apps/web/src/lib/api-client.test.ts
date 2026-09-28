import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchPaginatedApi } from "./api-client";

const storage = new Map<string, string>();
vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
});

describe("fetchPaginatedApi token refresh", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("refreshes after 401 and retries the paginated request", async () => {
    localStorage.setItem("token", "expired-access");
    localStorage.setItem("refresh_token", "valid-refresh");
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { access_token: "new-access", refresh_token: "new-refresh" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: [{ id: 1 }], meta: { page: 1 } }), { status: 200 }));

    const result = await fetchPaginatedApi<Array<{ id: number }>>("/api/v1/students");

    expect(result.data).toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][1]?.headers).toBeInstanceOf(Headers);
    expect((fetchMock.mock.calls[2][1]?.headers as Headers).get("Authorization")).toBe("Bearer new-access");
    expect(localStorage.getItem("refresh_token")).toBe("new-refresh");
  });
});
