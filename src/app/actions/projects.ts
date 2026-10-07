"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, errorMessage } from "@/lib/api";
import type { ProjectDetail, TaskStatus } from "@/lib/data";
import type { FormState } from "./auth";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalDate(value: FormDataEntryValue | null) {
  const v = String(value ?? "").trim();
  return DATE_RE.test(v) ? v : null;
}

function projectFields(formData: FormData) {
  return {
    title: text(formData, "title"),
    kind: text(formData, "kind"),
    goal: text(formData, "goal"),
    description: text(formData, "description"),
    start_date: optionalDate(formData.get("start_date")),
    deadline: optionalDate(formData.get("deadline")),
  };
}

function readTasks(formData: FormData) {
  const titles = formData.getAll("task_title").map((v) => String(v).trim());
  const assignees = formData.getAll("task_assignee").map((v) => Number(v) || null);
  const deadlines = formData.getAll("task_deadline").map(optionalDate);
  return titles
    .map((title, i) => ({ title, assignee_id: assignees[i] ?? null, deadline: deadlines[i] ?? null }))
    .filter((t) => t.title.length > 0);
}

export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  let project: ProjectDetail;
  try {
    project = await api("/projects", {
      method: "POST",
      body: { ...projectFields(formData), tasks: readTasks(formData) },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/", "layout");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = Number(formData.get("id"));
  try {
    await api(`/projects/${id}`, { method: "PUT", body: projectFields(formData) });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/", "layout");
  redirect(`/projects/${id}`);
}

export async function deleteProject(formData: FormData) {
  await api(`/projects/${Number(formData.get("id"))}`, { method: "DELETE" });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function addTask(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await api(`/projects/${Number(formData.get("project_id"))}/tasks`, {
      method: "POST",
      body: {
        title: text(formData, "title"),
        description: text(formData, "description"),
        assignee_id: Number(formData.get("assignee_id")) || null,
        deadline: optionalDate(formData.get("deadline")),
      },
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTask(formData: FormData) {
  await api(`/tasks/${Number(formData.get("id"))}`, { method: "DELETE" });
  revalidatePath("/", "layout");
}

export async function updateTaskStatus(taskId: number, status: TaskStatus): Promise<FormState> {
  try {
    await api(`/tasks/${taskId}/status`, { method: "PATCH", body: { status } });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
