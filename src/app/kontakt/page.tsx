import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt | Energiakalkulaator",
};

export default function ContactPage() {
  return (
    <div className="relative page-bg">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora" />
        <div className="grid-glow" />
      </div>

      <main className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">
        <header className="glass-panel rounded-3xl p-7 sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">Kontakt</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Saada tagasisidet või küsi lisainfot energiakalkulaator.ee kasutamise kohta.
            Teenust osutab hetkel eraisik Kenneth Alto.
          </p>
        </header>

        <section className="mt-6 glass-panel rounded-3xl p-7 text-sm text-zinc-300 sm:p-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-xs text-zinc-400">E-post</div>
              <div className="mt-1 text-sm font-semibold text-zinc-50">
                <a className="text-emerald-200 underline underline-offset-4" href="mailto:kennethalto95@gmail.com">
                  kennethalto95@gmail.com
                </a>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-xs text-zinc-400">Nimi</div>
              <div className="mt-1 text-sm font-semibold text-zinc-50">Kenneth Alto</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-xs text-zinc-400">Staatus</div>
              <div className="mt-1 text-sm font-semibold text-zinc-50">Tegutseb hetkel eraisikuna</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="text-xs text-zinc-400">Lisainfo</div>
              <div className="mt-1 text-sm font-semibold text-zinc-50">
                Täiendavad andmed lisatakse pärast ettevõtlusvormi vormistamist.
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
            <div className="text-sm font-semibold text-zinc-50">Kiire link</div>
            <p className="mt-1 text-sm text-zinc-300">
              Alusta kalkulaatoritest siit:{" "}
              <Link href="/kalkulaatorid/paikesejaam" className="text-emerald-200 underline underline-offset-4">
                ava kalkulaatorite hub
              </Link>
              .
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="text-sm font-semibold text-zinc-50">Kirjuta kohe</div>
            <p className="mt-1 text-sm text-zinc-300">
              Vajuta e-postile ja lisa oma küsimus / sisendid:
              <br />
              <a className="text-emerald-200 underline underline-offset-4" href="mailto:kennethalto95@gmail.com">
                kennethalto95@gmail.com
              </a>
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              Vormi kaudu saadetud andmeid kasutatakse ainult päringule vastamiseks.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

