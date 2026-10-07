import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ListChecksIcon,
  PencilSimpleIcon,
  TargetIcon,
  TrashIcon,
} from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/auth";
import { getProject, listMembers } from "@/lib/data";
import { daysUntil, deadlineLabel, formatDate } from "@/lib/format";
import { deleteProject, deleteTask } from "@/app/actions/projects";
import { AddTaskForm } from "@/components/add-task-form";
import { ConfirmForm } from "@/components/confirm-form";
import { TaskStatusControl } from "@/components/task-status-control";
import {
  Avatar,
  EmptyState,
  KindBadge,
  ProgressBar,
  StatusBadge,
  buttonClass,
  cx,
} from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/projects/[id]">): Promise<Metadata> {
  const project = await getProject(Number((await params).id));
  return { title: project?.title ?? "Loyiha" };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const user = await requireUser();
  const isCeo = user.role === "ceo";
  const [project, team] = await Promise.all([
    getProject(Number((await params).id)),
    isCeo ? listMembers() : [],
  ]);
  if (!project) notFound();

  const tasks = project.tasks;
  const members = team.map(({ id, name }) => ({ id, name }));
  const todo = tasks.filter((t) => t.status === "todo").length;
  const finished = project.total > 0 && project.done === project.total;
  const days = daysUntil(project.deadline);

  const contributors = project.people.map((p) => {
    const own = tasks.filter((t) => t.assignee_id === p.id);
    return { ...p, total: own.length, done: own.filter((t) => t.status === "done").length };
  });

  return (
    <div className="grid gap-8">
      <Link href="/" className="inline-flex items-center gap-1.5 justify-self-start text-sm text-muted hover:text-ink">
        <ArrowLeftIcon size={14} />
        Bosh sahifa
      </Link>

      <header className="animate-rise flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <KindBadge kind={project.kind} />
            {finished ? (
              <span className="inline-flex h-6 items-center rounded-md bg-accent px-2 text-xs font-medium text-accent-ink">
                Yakunlandi
              </span>
            ) : null}
          </div>
          <h1 className="max-w-[28ch] text-2xl font-semibold leading-tight tracking-tight md:text-4xl">
            {project.title}
          </h1>
        </div>
        {isCeo ? (
          <div className="flex gap-2">
            <Link href={`/projects/${project.id}/edit`} className={buttonClass("secondary", "sm")}>
              <PencilSimpleIcon size={14} />
              Tahrirlash
            </Link>
            <ConfirmForm
              action={deleteProject}
              fields={{ id: project.id }}
              message="Loyiha va uning barcha topshiriqlari o‘chiriladi. Davom etasizmi?"
            >
              <button type="submit" className={buttonClass("danger", "sm")}>
                <TrashIcon size={14} />
                O‘chirish
              </button>
            </ConfirmForm>
          </div>
        ) : null}
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-8">
          <section className="grid gap-3 rounded-xl border border-accent/25 bg-accent-soft p-5 md:p-6">
            <h2 className="inline-flex items-center gap-2 text-sm font-medium text-accent-soft-ink">
              <TargetIcon size={18} weight="bold" />
              Loyiha maqsadi
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-ink md:text-lg">{project.goal}</p>
            {project.description ? (
              <p className="whitespace-pre-line border-t border-accent/20 pt-3 text-sm leading-relaxed text-muted">
                {project.description}
              </p>
            ) : null}
          </section>

          <section className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                Topshiriqlar <span className="font-mono text-sm font-normal text-faint">{tasks.length}</span>
              </h2>
              {isCeo ? <AddTaskForm projectId={project.id} members={members} /> : null}
            </div>

            {tasks.length === 0 ? (
              <EmptyState
                icon={<ListChecksIcon size={22} />}
                title="Topshiriqlar hali yo‘q"
                text={
                  isCeo
                    ? "Loyiha maqsadiga erishish uchun topshiriqlar qo‘shing va ularni jamoa a‘zolariga biriktiring."
                    : "Rahbar topshiriqlarni taqsimlaganda shu yerda ko‘rinadi."
                }
              />
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
                {tasks.map((t, i) => {
                  const mine = t.assignee_id === user.id;
                  const canEdit = isCeo || mine;
                  const taskDays = daysUntil(t.deadline);
                  const overdue = t.status !== "done" && taskDays !== null && taskDays < 0;
                  return (
                    <li
                      key={t.id}
                      style={{ "--i": i } as CSSProperties}
                      className={cx(
                        "animate-rise grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 md:px-5",
                        mine && !isCeo && "bg-accent-soft/40",
                      )}
                    >
                      <div className="grid min-w-0 gap-1.5">
                        <p
                          className={cx(
                            "text-sm font-medium leading-snug",
                            t.status === "done" && "text-muted line-through decoration-faint",
                          )}
                        >
                          {t.title}
                        </p>
                        {t.description ? (
                          <p className="text-xs leading-relaxed text-muted">{t.description}</p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            {t.assignee_name ? <Avatar name={t.assignee_name} size="sm" /> : null}
                            {t.assignee_name ?? "Ijrochi biriktirilmagan"}
                            {mine ? <span className="font-medium text-accent">(siz)</span> : null}
                          </span>
                          <span className={cx(overdue && "text-danger")}>
                            {t.deadline ? `${formatDate(t.deadline)}, ` : ""}
                            {t.status === "done" ? "bajarildi" : deadlineLabel(t.deadline).toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end">
                        {canEdit ? <TaskStatusControl taskId={t.id} status={t.status} /> : <StatusBadge status={t.status} />}
                        {isCeo ? (
                          <ConfirmForm action={deleteTask} fields={{ id: t.id }} message="Topshiriq o‘chirilsinmi?">
                            <button
                              type="submit"
                              aria-label="Topshiriqni o‘chirish"
                              className="rounded-lg p-2 text-faint transition-colors hover:bg-danger-soft hover:text-danger"
                            >
                              <TrashIcon size={15} />
                            </button>
                          </ConfirmForm>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-24">
          <section className="grid gap-4 rounded-xl border border-line bg-surface p-5">
            <div className="flex items-end justify-between">
              <h2 className="text-sm font-medium text-muted">Bajarilish</h2>
              <p className="font-mono text-4xl font-medium leading-none tracking-tight tabular-nums">
                {project.progress}
                <span className="text-lg text-faint">%</span>
              </p>
            </div>
            <ProgressBar value={project.progress} className="h-2" />
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Kutilmoqda", value: todo },
                { label: "Jarayonda", value: project.in_progress },
                { label: "Bajarildi", value: project.done },
              ].map((s) => (
                <div key={s.label} className="grid gap-0.5 rounded-lg bg-sunken py-2.5">
                  <dd className="font-mono text-lg tabular-nums">{s.value}</dd>
                  <dt className="text-[11px] text-muted">{s.label}</dt>
                </div>
              ))}
            </dl>
          </section>

          <section className="grid gap-3 rounded-xl border border-line bg-surface p-5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted">Boshlangan</span>
              <span>{project.start_date ? formatDate(project.start_date) : "Belgilanmagan"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted">Muddat</span>
              <span className={cx(!finished && days !== null && days < 0 && "text-danger")}>
                {project.deadline ? formatDate(project.deadline) : "Belgilanmagan"}
              </span>
            </div>
            {project.deadline && !finished ? (
              <p className={cx("text-xs", days !== null && days < 0 ? "text-danger" : "text-faint")}>
                {deadlineLabel(project.deadline)}
              </p>
            ) : null}
          </section>

          <section className="grid gap-3 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-sm font-medium text-muted">Ijrochilar</h2>
            {contributors.length === 0 ? (
              <p className="text-sm text-faint">Hali hech kim biriktirilmagan.</p>
            ) : (
              <ul className="grid gap-3">
                {contributors.map((c) => (
                  <li key={c.id} className="flex items-center gap-3">
                    <Avatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <ProgressBar value={c.total ? Math.round((c.done / c.total) * 100) : 0} className="mt-1.5 h-1" />
                    </div>
                    <span className="font-mono text-xs tabular-nums text-muted">
                      {c.done}/{c.total}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
