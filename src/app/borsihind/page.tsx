import Link from "next/link";
import { fetchEleringNpsSeries } from "@/lib/elering";
import { PriceViewClient } from "@/components/market-price/price-view-client";

export const metadata = {
  title: "Börsihind · Energiakalkulaator",
};

function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function BorsihindPage() {
  const now = new Date();
  const nowTs = Math.floor(now.getTime() / 1000);
  const today = startOfDayLocal(now);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  // Fetch a wide range to cover both days robustly.
  const startIso = new Date(yesterday.getTime() - 3 * 60 * 60 * 1000).toISOString();
  const endIso = new Date(tomorrow.getTime() + 27 * 60 * 60 * 1000).toISOString();

  let series: Awaited<ReturnType<typeof fetchEleringNpsSeries>> | null = null;
  let error: string | null = null;
  try {
    series = await fetchEleringNpsSeries({ startIso, endIso, area: "ee", revalidateSeconds: 60 });
  } catch (e) {
    error = e instanceof Error ? e.message : "Börsihinda ei õnnestunud laadida.";
  }

  return (
    <div className="relative page-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora" />
        <div className="grid-glow" />
      </div>

      <main className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <header className="glass-panel rounded-3xl p-5 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs tracking-wide text-emerald-200">
                Elering · Eesti (EE)
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
                Börsihind
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
                Andmerikas vaade Eesti (EE) börsihinnale: kokkuvõte, graafik, tabel ja olulisemad aknad.
              </p>
            </div>
            <Link href="/kalkulaatorid" className="btn-ghost inline-flex">
              Tagasi kalkulaatoritesse
            </Link>
          </div>
        </header>

        {error ? (
          <section className="mt-8 glass-panel rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-zinc-50">Hinda ei saanud laadida</h2>
            <p className="mt-2 text-sm text-zinc-300">{error}</p>
            <p className="mt-3 text-xs text-zinc-400">
              Proovi mõne minuti pärast uuesti. Kui probleem püsib, võib Eleringi teenus olla ajutiselt häiritud.
            </p>
          </section>
        ) : null}

        {series && series.points.length > 0 ? (
          <PriceViewClient points={series.points} intervalMinutes={series.intervalMinutes} nowTs={nowTs} />
        ) : null}
      </main>
    </div>
  );
}

