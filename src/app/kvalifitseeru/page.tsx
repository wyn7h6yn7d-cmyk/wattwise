import Link from "next/link";
import { QualifyForm } from "@/app/kvalifitseeru/qualify-form";

export default function QualifyPage() {
  return (
    <div className="relative page-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora" />
        <div className="grid-glow" />
      </div>

      <main className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <QualifyForm />

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
          Kui soovid lihtsalt otse kirjutada, siis vaata ka{" "}
          <Link href="/kontakt" className="text-emerald-200 underline underline-offset-4">
            kontakti
          </Link>
          .
        </div>
      </main>
    </div>
  );
}

