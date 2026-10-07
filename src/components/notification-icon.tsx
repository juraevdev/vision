import { CheckCircleIcon, FolderSimplePlusIcon, ListChecksIcon } from "@phosphor-icons/react/ssr";
import type { NotificationType } from "@/lib/data";
import { cx } from "./ui";

export function NotificationIcon({ type, unread }: { type: NotificationType; unread?: boolean }) {
  const IconCmp =
    type === "project" ? FolderSimplePlusIcon : type === "task" ? ListChecksIcon : CheckCircleIcon;
  return (
    <span
      className={cx(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
        unread ? "bg-accent-soft text-accent-soft-ink" : "bg-sunken text-faint",
      )}
    >
      <IconCmp size={16} weight="bold" />
    </span>
  );
}
