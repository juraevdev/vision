import type { Metadata } from "next";
import Link from "next/link";
import { BellSlashIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/auth";
import { getNotifications } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import { markAllNotificationsRead } from "@/app/actions/account";
import { NotificationIcon } from "@/components/notification-icon";
import { NotificationLink } from "@/components/notification-link";
import { EmptyState, buttonClass, cx } from "@/components/ui";

export const metadata: Metadata = { title: "Bildirishnomalar" };

export default async function NotificationsPage() {
  await requireUser();
  const { unread, items } = await getNotifications(100);

  return (
    <div className="mx-auto grid max-w-3xl gap-8">
      <header className="animate-rise flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Bildirishnomalar</h1>
          <p className="text-sm text-muted">
            {unread > 0 ? `${unread} ta o‘qilmagan xabar` : "Barcha xabarlar o‘qilgan"}
          </p>
        </div>
        {unread > 0 ? (
          <form action={markAllNotificationsRead}>
            <button type="submit" className={buttonClass("secondary", "sm")}>
              Hammasini o‘qildi qilish
            </button>
          </form>
        ) : null}
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={<BellSlashIcon size={22} />}
          title="Bildirishnoma yo‘q"
          text="Yangi loyiha qo‘shilganda yoki sizga topshiriq berilganda xabar shu yerda paydo bo‘ladi."
          action={
            <Link href="/" className={buttonClass("secondary", "sm")}>
              Bosh sahifa
            </Link>
          }
        />
      ) : (
        <ul className="overflow-hidden rounded-xl border border-line bg-surface">
          {items.map((n) => (
            <li key={n.id} className="border-b border-line last:border-b-0">
              <NotificationLink
                id={n.id}
                href={n.link}
                unread={!n.read_at}
                className={cx(
                  "flex w-full items-start gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-sunken",
                  !n.read_at && "bg-accent-soft/30",
                )}
              >
                <NotificationIcon type={n.type} unread={!n.read_at} />
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className={cx("text-sm leading-snug", n.read_at ? "text-muted" : "font-medium text-ink")}>
                    {n.title}
                  </span>
                  {n.body ? <span className="text-xs leading-relaxed text-muted">{n.body}</span> : null}
                </span>
                <span className="shrink-0 text-xs text-faint">{timeAgo(n.created_at)}</span>
              </NotificationLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
