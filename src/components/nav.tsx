"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  PlusIcon,
  SquaresFourIcon,
  UserCircleIcon,
  UsersThreeIcon,
  type Icon,
} from "@phosphor-icons/react";
import type { Role } from "@/lib/auth";
import { cx } from "./ui";

type Item = { href: string; label: string; icon: Icon; ceoOnly?: boolean };

const ITEMS: Item[] = [
  { href: "/", label: "Bosh sahifa", icon: SquaresFourIcon },
  { href: "/projects/new", label: "Yangi loyiha", icon: PlusIcon, ceoOnly: true },
  { href: "/team", label: "Jamoa", icon: UsersThreeIcon, ceoOnly: true },
  { href: "/notifications", label: "Bildirishnomalar", icon: BellIcon },
  { href: "/profile", label: "Profil", icon: UserCircleIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || /^\/projects\/\d+/.test(pathname);
  return pathname.startsWith(href);
}

function useItems(role: Role) {
  return ITEMS.filter((item) => !item.ceoOnly || role === "ceo");
}

export function SidebarNav({ role, unread }: { role: Role; unread: number }) {
  const pathname = usePathname();
  const items = useItems(role).filter((item) => item.href !== "/projects/new");

  return (
    <nav className="grid gap-0.5">
      {items.map(({ href, label, icon: IconCmp }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-200",
              active ? "bg-sunken font-medium text-ink" : "text-muted hover:bg-sunken/70 hover:text-ink",
            )}
          >
            <IconCmp size={18} weight={active ? "fill" : "regular"} />
            <span className="flex-1">{label}</span>
            {href === "/notifications" && unread > 0 ? (
              <span className="rounded-md bg-accent px-1.5 font-mono text-[11px] leading-5 text-accent-ink">
                {unread}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = useItems(role);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md">
        {items.map(({ href, label, icon: IconCmp }) => {
          const active = href === "/projects/new" ? pathname === href : isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px]",
                active ? "text-accent" : "text-faint",
              )}
            >
              <IconCmp size={22} weight={active ? "fill" : "regular"} />
              <span className="max-w-full truncate px-1">{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
