import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError, SESSION_COOKIE } from "./api";

export type Role = "ceo" | "member";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  position: string;
};

export async function createSession(token: string, expiresAt: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === "true"
      : process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession() {
  const store = await cookies();
  if (store.has(SESSION_COOKIE)) await api("/auth/logout", { method: "POST" }).catch(() => {});
  store.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!(await cookies()).has(SESSION_COOKIE)) return null;
  try {
    return await api<User>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireCeo(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ceo") redirect("/");
  return user;
}
