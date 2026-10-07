import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-md content-center gap-4 px-6">
      <p className="font-mono text-sm text-faint">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Sahifa topilmadi</h1>
      <p className="text-sm leading-relaxed text-muted">
        Loyiha o‘chirilgan yoki havola noto‘g‘ri bo‘lishi mumkin.
      </p>
      <Link href="/" className={`${buttonClass("primary")} justify-self-start`}>
        Bosh sahifaga qaytish
      </Link>
    </main>
  );
}
