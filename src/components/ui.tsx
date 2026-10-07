import type { ReactNode } from "react";
import { initials, KIND_LABEL, STATUS_LABEL } from "@/lib/format";
import type { Person, ProjectKind, TaskStatus } from "@/lib/data";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function buttonClass(variant: ButtonVariant = "primary", size: "sm" | "md" = "md") {
  return cx(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium",
    "transition-[background-color,border-color,color,transform] duration-200 active:translate-y-px",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-50",
    size === "md" ? "h-10 px-4 text-sm" : "h-8 px-3 text-[13px]",
    variant === "primary" && "bg-accent text-accent-ink hover:bg-accent-hover",
    variant === "secondary" &&
      "border border-line-strong bg-surface text-ink hover:border-faint hover:bg-sunken",
    variant === "ghost" && "text-muted hover:bg-sunken hover:text-ink",
    variant === "danger" && "border border-line-strong bg-surface text-danger hover:bg-danger-soft",
  );
}

export const inputClass = cx(
  "w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink",
  "placeholder:text-faint transition-colors duration-200",
  "hover:border-faint focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/20",
);

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("grid gap-2", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error)
    return (
      <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
        {error}
      </p>
    );
  if (success)
    return (
      <p role="status" className="rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent-soft-ink">
        {success}
      </p>
    );
  return null;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      title={name}
      className={cx(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full border border-line-strong bg-sunken font-medium text-muted",
        size === "sm" && "size-6 text-[10px]",
        size === "md" && "size-8 text-xs",
        size === "lg" && "size-11 text-sm",
      )}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ people, max = 4 }: { people: Person[]; max?: number }) {
  if (people.length === 0) return <span className="text-xs text-faint">Ijrochi yo‘q</span>;
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((p) => (
        <span key={p.id} className="rounded-full ring-2 ring-surface">
          <Avatar name={p.name} size="sm" />
        </span>
      ))}
      {rest > 0 ? (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-sunken text-[10px] font-medium text-muted ring-2 ring-surface">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cx("h-1.5 w-full overflow-hidden rounded-full bg-sunken", className)}
    >
      <div
        className="animate-fill h-full rounded-full bg-accent"
        style={{ width: `${Math.max(value, value > 0 ? 3 : 0)}%` }}
      />
    </div>
  );
}

export function KindBadge({ kind }: { kind: ProjectKind }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium",
        kind === "new"
          ? "border-accent/30 bg-accent-soft text-accent-soft-ink"
          : "border-line-strong bg-sunken text-muted",
      )}
    >
      {KIND_LABEL[kind]}
    </span>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center rounded-md px-2 text-xs font-medium",
        status === "done" && "bg-accent-soft text-accent-soft-ink",
        status === "in_progress" && "border border-accent/40 text-accent-soft-ink",
        status === "todo" && "bg-sunken text-muted",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-line-strong px-6 py-10 sm:items-center sm:text-center">
      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-sunken text-muted">
        {icon}
      </span>
      <div className="grid gap-1">
        <p className="font-medium text-ink">{title}</p>
        <p className="max-w-[46ch] text-sm leading-relaxed text-muted">{text}</p>
      </div>
      {action}
    </div>
  );
}
