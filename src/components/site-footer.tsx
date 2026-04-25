import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10 bg-zinc-950/65">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/45 shadow-[0_0_24px_rgba(16,185,129,0.20)]">
              <Image
                src="/logo.png"
                alt="Energiakalkulaator"
                width={48}
                height={48}
                sizes="48px"
                quality={100}
                unoptimized
                className="h-[92%] w-[92%] object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-50">Energiakalkulaator</div>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-zinc-400">
            Targemad energiaotsused andmepõhiselt ja lihtsalt.
          </p>
        </div>

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-100">Toode</div>
          <ul className="mt-4 grid gap-2 text-sm">
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
          <ul className="mt-4 grid gap-2 text-sm">
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
              <Link className="text-zinc-400 hover:text-zinc-100" href="/kontakt">
                Kontakt
              </Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-100">Ressursid</div>
          <ul className="mt-4 grid gap-2 text-sm">
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

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-100">Kontakt</div>
          <ul className="mt-4 grid gap-2 text-sm text-zinc-400">
            <li>Kenneth Alto</li>
            <li>
              <a className="hover:text-zinc-100" href="mailto:kennethalto95@gmail.com">
                kennethalto95@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-zinc-500">© {year} Energiakalkulaator</div>
    </footer>
  );
}

