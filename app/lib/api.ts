const BASE = "/api";

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
    const msg =
      typeof body === "string"
        ? body
        : body?.message ?? body?.error ?? `HTTP ${status}`;
    super(msg);
    this.status = status;
    this.body = body;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
  });

  
  if (!res.ok) {
    const body = await res.json().catch(() => res.statusText);
    throw new ApiError(res.status, body);
  }

  return res.json();
}
