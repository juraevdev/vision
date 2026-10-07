import "server-only";
import { api, ApiError } from "./api";

export type ProjectKind = "new" | "ongoing";
export type TaskStatus = "todo" | "in_progress" | "done";
export type NotificationType = "project" | "task" | "status";

export type Person = { id: number; name: string };

export type ProjectSummary = {
  id: number;
  title: string;
  kind: ProjectKind;
  goal: string;
  description: string;
  start_date: string | null;
  deadline: string | null;
  created_at: string;
  total: number;
  done: number;
  in_progress: number;
  progress: number;
  people: Person[];
};

export type Task = {
  id: number;
  project_id: number;
  project_title: string;
  assignee_id: number | null;
  assignee_name: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectDetail = ProjectSummary & { tasks: Task[] };

export type Member = {
  id: number;
  name: string;
  email: string;
  position: string;
  created_at: string;
  open_tasks: number;
  done_tasks: number;
};

export type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type NotificationFeed = { unread: number; items: Notification[] };

export function listProjects() {
  return api<ProjectSummary[]>("/projects");
}

export async function getProject(id: number): Promise<ProjectDetail | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  try {
    return await api<ProjectDetail>(`/projects/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function listMyTasks() {
  return api<Task[]>("/tasks/mine");
}

export function listMembers() {
  return api<Member[]>("/members");
}

export function getNotifications(limit = 12) {
  return api<NotificationFeed>(`/notifications?limit=${limit}`);
}
