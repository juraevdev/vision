"use server";

import { revalidatePath } from "next/cache";
import { api, errorMessage } from "@/lib/api";
import type { FormState } from "./auth";

export async function markNotificationRead(id: number) {
  await api(`/notifications/${id}/read`, { method: "POST" });
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  await api("/notifications/read-all", { method: "POST" });
  revalidatePath("/", "layout");
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await api("/auth/me", {
      method: "PATCH",
      body: {
        name: String(formData.get("name") ?? "").trim(),
        position: String(formData.get("position") ?? "").trim(),
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await api("/auth/me/password", {
      method: "POST",
      body: {
        current: String(formData.get("current") ?? ""),
        next: String(formData.get("next") ?? ""),
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  return { ok: true };
}
