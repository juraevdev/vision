import Link from "next/link";
import { ArrowRightIcon, FolderOpenIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/auth";
import { listMembers, listMyTasks, listProjects, type ProjectSummary } from "@/lib/data";
import { deadlineLabel, daysUntil } from "@/lib/format";
import { ProjectCard } from "@/components/project-card";
import { TaskStatusControl } from "@/components/task-status-control";
import { Avatar, EmptyState, buttonClass, cx } from "@/components/ui";

const FILTERS = [
  { key: "all", label: "Hammasi" },
  { key: "new", label: "Yangi" },
  { key: "ongoing", label: "Joriy" },
  { key: "done", label: "Yakunlangan" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function isFinished(p: ProjectSummary) {
  return p.total > 0 && p.done === p.total;
}

function matches(p: ProjectSummary, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "done") return isFinished(p);
  return p.kind === filter && !isFinished(p);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Xayrli tong";
  if (hour < 18) return "Xayrli kun";
  return "Xayrli kech";
}

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const { filter: rawFilter } = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === rawFilter) ? (rawFilter as FilterKey) : "all";

  const isCeo = user.role === "ceo";
  const [projects, myTasks, members] = await Promise.all([
    listProjects(),
    isCeo ? [] : listMyTasks(),
    isCeo ? listMembers() : [],
  ]);
  const visible = projects.filter((p) => matches(p, filter));
  const avgProgress = projects.length
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
    : 0;

  const stats = [
    { label: "Jami loyihalar", value: projects.length },
    { label: "Joriy", value: projects.filter((p) => p.kind === "ongoing" && !isFinished(p)).length },
    { label: "Yangi", value: projects.filter((p) => p.kind === "new" && !isFinished(p)).length },
    { label: "O‘rtacha progress", value: `${avgProgress}%` },
    isCeo
      ? { label: "Jamoa a‘zolari", value: members.length }
      : { label: "Ochiq topshiriqlarim", value: myTasks.filter((t) => t.status !== "done").length },
  ];

  return (
    <div className="grid gap-10">
      <header className="animate-rise grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {greeting()}, {user.name}
        </h1>
        <p className="text-sm text-muted">
          {isCeo
            ? "Tizimdagi barcha loyihalar va ularning bajarilish holati."
            : "Jamoa loyihalari va sizga berilgan topshiriqlar."}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={cx("grid gap-1 bg-surface px-5 py-4", i === stats.length - 1 && "col-span-2 lg:col-span-1")}
          >
            <dt className="text-xs text-muted">{s.label}</dt>
            <dd className="font-mono text-2xl font-medium tracking-tight tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="grid gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Loyihalar</h2>
            <nav className="flex gap-1 rounded-lg bg-sunken p-1" aria-label="Loyihalarni saralash">
              {FILTERS.map((f) => {
                const count = projects.filter((p) => matches(p, f.key)).length;
                const active = f.key === filter;
                return (
                  <Link
                    key={f.key}
                    href={f.key === "all" ? "/" : `/?filter=${f.key}`}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] transition-colors duration-200",
                      active ? "bg-surface font-medium text-ink shadow-card" : "text-muted hover:text-ink",
                    )}
                  >
                    {f.label}
                    <span className="font-mono text-[11px] text-faint">{count}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={<FolderOpenIcon size={22} />}
              title={projects.length === 0 ? "Hali loyiha qo‘shilmagan" : "Bu bo‘limda loyiha yo‘q"}
              text={
                projects.length === 0
                  ? isCeo
                    ? "Birinchi loyihani qo‘shing: maqsadni yozing va topshiriqlarni jamoa a‘zolariga taqsimlang."
                    : "Rahbar yangi loyiha qo‘shganda bu yerda paydo bo‘ladi va sizga bildirishnoma keladi."
                  : "Boshqa bo‘limni tanlang yoki barcha loyihalarni ko‘ring."
              }
              action={
                isCeo && projects.length === 0 ? (
                  <Link href="/projects/new" className={buttonClass("primary")}>
                    <PlusIcon size={16} weight="bold" />
                    Yangi loyiha
                  </Link>
                ) : null
              }
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {visible.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>
          )}
        </section>

        <aside className="grid gap-4 lg:sticky lg:top-24">
          {isCeo ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Jamoa yuklamasi</h2>
                <Link href="/team" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                  Jamoa <ArrowRightIcon size={12} weight="bold" />
                </Link>
              </div>
              {members.length === 0 ? (
                <EmptyState
                  icon={<PlusIcon size={22} />}
                  title="Jamoa a‘zolari yo‘q"
                  text="Topshiriq berish uchun avval jamoa a‘zolarini qo‘shing."
                  action={
                    <Link href="/team" className={buttonClass("secondary", "sm")}>
                      A‘zo qo‘shish
                    </Link>
                  }
                />
              ) : (
                <ul className="grid gap-1 rounded-xl border border-line bg-surface p-2">
                  {members.map((m) => {
                    const total = m.open_tasks + m.done_tasks;
                    return (
                      <li key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                        <Avatar name={m.name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{m.name}</p>
                          <p className="truncate text-xs text-faint">{m.position || "Jamoa a‘zosi"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm tabular-nums">{m.open_tasks}</p>
                          <p className="text-[11px] text-faint">{total ? `${m.done_tasks}/${total} bajarildi` : "topshiriq yo‘q"}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold tracking-tight">Mening topshiriqlarim</h2>
              {myTasks.length === 0 ? (
                <EmptyState
                  icon={<FolderOpenIcon size={22} />}
                  title="Topshiriq yo‘q"
                  text="Rahbar sizga topshiriq berganda shu yerda ko‘rinadi."
                />
              ) : (
                <ul className="grid gap-2">
                  {myTasks.map((t) => {
                    const days = daysUntil(t.deadline);
                    const overdue = t.status !== "done" && days !== null && days < 0;
                    return (
                      <li
                        key={t.id}
                        className={cx(
                          "grid gap-3 rounded-xl border border-line bg-surface p-4",
                          t.status === "done" && "opacity-70",
                        )}
                      >
                        <div className="grid gap-1">
                          <p className={cx("text-sm font-medium leading-snug", t.status === "done" && "line-through decoration-faint")}>
                            {t.title}
                          </p>
                          <Link href={`/projects/${t.project_id}`} className="truncate text-xs text-muted hover:text-accent">
                            {t.project_title}
                          </Link>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className={cx("text-xs", overdue ? "text-danger" : "text-faint")}>
                            {t.status === "done" ? "Bajarildi" : deadlineLabel(t.deadline)}
                          </span>
                          <TaskStatusControl taskId={t.id} status={t.status} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
