import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="relative page-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora" />
        <div className="grid-glow" />
      </div>

      <main className="relative mx-auto w-full max-w-4xl px-5 pb-16 pt-12 sm:px-8 lg:px-10">
        <header className="glass-panel rounded-3xl p-8 sm:p-12">
          <p className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs tracking-wide text-emerald-200">
            Hetkel tasuta beetaversioon
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
            Kõik tööriistad on praegu tasuta
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-300">
            Energiakalkulaatori kogu funktsionaalsus on kasutatav tasuta beetaversioonina.
            Keskendu tulemuste testimisele ja anna julgelt tagasisidet.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/kalkulaatorid" className="btn-glow inline-flex">
              Ava kalkulaatorid
            </Link>
            <Link href="/kontakt" className="btn-ghost inline-flex">
              Võta ühendust
            </Link>
          </div>
        </header>
      </main>
    </div>
  );
}

