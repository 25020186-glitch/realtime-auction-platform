import type { ApiErrorPayload, AuthSession } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const WS_BASE = API_BASE.replace(/^http/, "ws");

export class ApiError extends Error {
  status: number;
  code?: string;
  fieldErrors?: Record<string, string>;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || payload.error || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    this.name = "ApiError";
    this.status = status;
    this.code = payload.code;
    this.fieldErrors = payload.fieldErrors;
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  token?: string;
  body?: unknown;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, {
      code: "BACKEND_OFFLINE",
      message: "Không thể kết nối backend. Hãy kiểm tra Docker và cổng 8080.",
    });
  }

  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, payload as ApiErrorPayload);
  return payload as T;
}

export function authToken(session: AuthSession | null) {
  return session?.accessToken;
}
