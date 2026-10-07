"use server";

import { revalidatePath } from "next/cache";
import { api, errorMessage } from "@/lib/api";
import type { FormState } from "./auth";

export async function addMember(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await api("/members", {
      method: "POST",
      body: {
        name: String(formData.get("name") ?? "").trim(),
        email: String(formData.get("email") ?? "").trim(),
        position: String(formData.get("position") ?? "").trim(),
        password: String(formData.get("password") ?? ""),
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeMember(formData: FormData) {
  await api(`/members/${Number(formData.get("id"))}`, { method: "DELETE" });
  revalidatePath("/", "layout");
}
