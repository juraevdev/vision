"use server";

import { redirect } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import { createSession, destroySession } from "@/lib/auth";

export type FormState = { error?: string; ok?: boolean } | undefined;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email va parolni kiriting." };

  let session: { token: string; expires_at: string };
  try {
    session = await api("/auth/login", { method: "POST", body: { email, password } });
  } catch (error) {
    return { error: errorMessage(error) };
  }

  await createSession(session.token, session.expires_at);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
