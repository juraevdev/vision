"use client";

import { useEffect } from "react";
import { buttonClass } from "@/components/ui";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-md content-center gap-4 px-6">
      <p className="font-mono text-sm text-faint">503</p>
      <h1 className="text-2xl font-semibold tracking-tight">Server bilan bog‘lanib bo‘lmadi</h1>
      <p className="text-sm leading-relaxed text-muted">
        Ma’lumotlarni yuklashda xatolik yuz berdi. Backend xizmati ishlayotganini tekshirib, qayta urinib
        ko‘ring.
      </p>
      <button type="button" onClick={() => retry()} className={`${buttonClass("primary")} justify-self-start`}>
        Qayta urinish
      </button>
    </main>
  );
}
