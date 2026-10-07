import Link from "next/link";
import { PlusIcon, SignOutIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/auth";
import { getNotifications } from "@/lib/data";
import { logout } from "@/app/actions/auth";
import { MobileNav, SidebarNav } from "@/components/nav";
import { NotificationBell } from "@/components/notification-bell";
import { Avatar, buttonClass } from "@/components/ui";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const { unread, items: notifications } = await getNotifications(12);
  const roleLabel = user.role === "ceo" ? "CEO" : user.position || "Jamoa a‘zosi";

  return (
    <div className="min-h-[100dvh] md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r border-line bg-surface px-3 py-5 md:flex">
        <Link href="/" className="px-3 text-lg font-semibold tracking-tight">
          Vision
        </Link>

        {user.role === "ceo" ? (
          <Link href="/projects/new" className={`${buttonClass("primary")} mx-1 mt-6`}>
            <PlusIcon size={16} weight="bold" />
            Yangi loyiha
          </Link>
        ) : null}

        <div className="mt-6 flex-1">
          <SidebarNav role={user.role} unread={unread} />
        </div>

        <div className="flex items-center gap-3 border-t border-line px-2 pt-4">
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-faint">{roleLabel}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Chiqish"
              title="Chiqish"
              className="rounded-lg p-2 text-faint transition-colors hover:bg-sunken hover:text-ink"
            >
              <SignOutIcon size={18} />
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-canvas/90 px-4 backdrop-blur md:justify-end md:px-8">
          <Link href="/" className="text-lg font-semibold tracking-tight md:hidden">
            Vision
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell unread={unread} items={notifications} />
            <Link href="/profile" className="rounded-full md:hidden" aria-label="Profil">
              <Avatar name={user.name} />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pb-28 pt-8 md:px-8 md:pb-16">
          {children}
        </main>
      </div>

      <MobileNav role={user.role} />
    </div>
  );
}
