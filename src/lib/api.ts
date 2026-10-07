import "server-only";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "vision_session";

const API_URL = (process.env.API_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown };

export async function api<T = void>(path: string, { method = "GET", body }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(503, "Server bilan bog‘lanib bo‘lmadi. Backend ishga tushirilganini tekshiring.");
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "Kutilmagan xatolik yuz berdi.";
    throw new ApiError(res.status, detail);
  }
  return data as T;
}

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Kutilmagan xatolik yuz berdi.";
}
