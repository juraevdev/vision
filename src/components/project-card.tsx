import type { CSSProperties } from "react";
import Link from "next/link";
import { CalendarBlankIcon, ListChecksIcon } from "@phosphor-icons/react/ssr";
import type { ProjectSummary } from "@/lib/data";
import { daysUntil, deadlineLabel } from "@/lib/format";
import { AvatarStack, KindBadge, ProgressBar, cx } from "./ui";

export function ProjectCard({ project, index = 0 }: { project: ProjectSummary; index?: number }) {
  const days = daysUntil(project.deadline);
  const finished = project.total > 0 && project.done === project.total;
  const overdue = !finished && days !== null && days < 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      style={{ "--i": index } as CSSProperties}
      className="animate-rise group grid gap-5 rounded-xl border border-line bg-surface p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <KindBadge kind={project.kind} />
            {finished ? (
              <span className="inline-flex h-6 items-center rounded-md bg-accent px-2 text-xs font-medium text-accent-ink">
                Yakunlandi
              </span>
            ) : null}
          </div>
          <h3 className="text-base font-semibold leading-snug tracking-tight group-hover:text-accent">
            {project.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">{project.goal}</p>
        </div>
        <p className="shrink-0 font-mono text-2xl font-medium tracking-tight tabular-nums">
          {project.progress}
          <span className="text-sm text-faint">%</span>
        </p>
      </div>

      <div className="grid gap-3">
        <ProgressBar value={project.progress} />
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <ListChecksIcon size={14} />
              <span className="tabular-nums">
                {project.done}/{project.total}
              </span>{" "}
              topshiriq
            </span>
            <span className={cx("inline-flex items-center gap-1.5", overdue && "text-danger")}>
              <CalendarBlankIcon size={14} />
              {finished ? "Bajarildi" : deadlineLabel(project.deadline)}
            </span>
          </div>
          <AvatarStack people={project.people} />
        </div>
      </div>
    </Link>
  );
}
