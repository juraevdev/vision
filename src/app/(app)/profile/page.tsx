import type { Metadata } from "next";
import { SignOutIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { Avatar, buttonClass } from "@/components/ui";
import { PasswordForm, ProfileForm } from "./forms";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto grid max-w-2xl gap-8">
      <header className="animate-rise flex items-center gap-4">
        <Avatar name={user.name} size="lg" />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
          <p className="truncate text-sm text-muted">
            {user.role === "ceo" ? "CEO" : user.position || "Jamoa a‘zosi"}, {user.email}
          </p>
        </div>
      </header>

      <ProfileForm name={user.name} position={user.position} />
      <PasswordForm />

      <form action={logout} className="md:hidden">
        <button type="submit" className={`${buttonClass("secondary")} w-full`}>
          <SignOutIcon size={16} />
          Chiqish
        </button>
      </form>
    </div>
  );
}
