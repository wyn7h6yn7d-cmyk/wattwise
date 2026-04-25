import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="premium-shell mt-12 border-t border-emerald-300/20 bg-zinc-950/88">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-6 lg:px-8 lg:py-9">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/40 shadow-[0_0_22px_rgba(16,185,129,0.18)]">
              <Image
                src="/logo.png"
                alt="Energiakalkulaator"
                width={44}
                height={44}
                sizes="44px"
                className="h-[92%] w-[92%] object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-50">Energiakalkulaator</div>
            </div>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
            Targemad energiaotsused andmepõhiselt ja lihtsalt.
          </p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-sm text-zinc-300">
            <p className="font-medium text-zinc-100">Kontakt</p>
            <p className="mt-1">Kenneth Alto</p>
            <a className="mt-0.5 inline-flex text-zinc-300 hover:text-emerald-100" href="mailto:kennethalto95@gmail.com">
              kennethalto95@gmail.com
            </a>
            <div className="mt-3 space-y-1 text-xs leading-relaxed text-zinc-400">
              <p>Teenust osutab hetkel eraisik Kenneth Alto.</p>
              <p>Registrikood lisatakse pärast ettevõtlusvormi valikut.</p>
              <p>KMKR lisatakse vajadusel.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-100">Toode</div>
          <ul className="mt-3 grid gap-2 text-sm">
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/kalkulaatorid">
                Kalkulaatorid
              </Link>
            </li>
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/borsihind">
                Börsihind
              </Link>
            </li>
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/pricing">
                Hinnad
              </Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-100">Ettevõte</div>
          <ul className="mt-3 grid gap-2 text-sm">
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/kontakt">
                Kontakt
              </Link>
            </li>
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/kkk">
                Korduma kippuvad küsimused
              </Link>
            </li>
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/blogi">
                Blogi
              </Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <div className="text-sm font-semibold text-zinc-100">Juriidiline</div>
          <ul className="mt-3 grid gap-2 text-sm">
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/kasutustingimused">
                Kasutustingimused
              </Link>
            </li>
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/privaatsuspoliitika">
                Privaatsuspoliitika
              </Link>
            </li>
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/vastutusest-loobumine">
                Vastutusest loobumine
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-3 text-center text-xs text-zinc-500">
        © {year} Energiakalkulaator · Kõik õigused kaitstud.
      </div>
    </footer>
  );
}

