import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  const showHint = process.env.NODE_ENV !== "production";

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16">
        <span className="text-lg font-semibold tracking-tight">Vision</span>

        <div className="animate-rise mx-auto w-full max-w-sm py-16">
          <h1 className="text-3xl font-semibold tracking-tight">Tizimga kirish</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Akkauntingiz yo‘q bo‘lsa, rahbaringizdan login va parol so‘rang.
          </p>
          <LoginForm />
          {showHint ? (
            <p className="mt-6 rounded-lg border border-line bg-surface px-3 py-2.5 text-xs leading-relaxed text-muted">
              Boshlang‘ich CEO akkaunti: <span className="font-mono text-ink">ceo@vision.uz</span> /{" "}
              <span className="font-mono text-ink">vision2026</span>
            </p>
          ) : null}
        </div>

        <p className="text-xs text-faint">Jamoa loyihalarini boshqarish tizimi</p>
      </section>

      <section className="relative hidden overflow-hidden bg-accent lg:flex lg:flex-col lg:justify-end lg:p-16">
        <div className="max-w-lg text-accent-ink">
          <p className="text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl">
            Har bir loyiha aniq maqsad bilan boshlanadi.
          </p>
          <p className="mt-5 max-w-[42ch] text-base leading-relaxed opacity-80">
            Rahbar maqsadni belgilaydi va topshiriqlarni taqsimlaydi. Jamoa esa har bir qadamni
            shu yerda kuzatib boradi.
          </p>
        </div>
      </section>
    </main>
  );
}
