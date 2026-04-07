import Link from "next/link";
import Image from "next/image";
import { FEATURES } from "@/lib/features";

const calcLinks = [
  { href: "/kalkulaatorid/paikesejaam", label: "Päikesejaama tasuvus" },
  { href: "/kalkulaatorid/vpp", label: "VPP tasuvusmudel" },
  { href: "/kalkulaatorid/elektripaketid", label: "Elektripaketi võrdlus" },
  { href: "/kalkulaatorid/ev-laadimine", label: "EV laadimise kalkulaator" },
  { href: "/kalkulaatorid/peak-shaving", label: "Peak shaving / ettevõtte võimsus" },
];

const legalLinks = [
  { href: "/kasutustingimused", label: "Kasutustingimused" },
  { href: "/privaatsuspoliitika", label: "Privaatsuspoliitika" },
  { href: "/cookie-policy", label: "Küpsiste kasutamine" },
  { href: "/tagastused-ja-tellimused", label: "Tagastused ja tellimused" },
  { href: "/vastutusest-loobumine", label: "Vastutusest loobumine" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-zinc-950/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-emerald-300/45 shadow-[0_0_24px_rgba(16,185,129,0.20)]">
              <Image
                src="/logo.png"
                alt="Energiakalkulaator"
                width={40}
                height={40}
                sizes="40px"
                quality={100}
                unoptimized
                className="h-[92%] w-[92%] object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-50">Energiakalkulaator</div>
              <div className="text-xs text-zinc-400">
                Arvuta energiaotsuste tasuvus targemalt.
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm text-zinc-400">
            Päikesejaama, VPP, elektripaketi, EV laadimise ja ettevõtte energiakulude kalkulaatorid
            ühes kohas. Tulemused on informatiivsed ja sõltuvad sisenditest.
          </p>
          <p className="mt-4 text-sm text-zinc-400">
            Teenust osutab hetkel eraisik <span className="font-medium text-zinc-200">Kenneth Alto</span>.
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Küsimused:{" "}
            <a className="text-emerald-200 underline underline-offset-4" href="mailto:kennethalto95@gmail.com">
              kennethalto95@gmail.com
            </a>
          </p>
        </div>

        <div className="lg:col-span-3">
          <div className="text-sm font-semibold text-zinc-100">Kalkulaatorid</div>
          <ul className="mt-4 grid gap-2 text-sm">
            {calcLinks.map((item) => (
              <li key={item.href}>
                <Link className="text-zinc-400 hover:text-zinc-100" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-100">Toode</div>
          <ul className="mt-4 grid gap-2 text-sm">
            {FEATURES.paywallEnabled ? (
              <li>
                <Link className="text-zinc-400 hover:text-zinc-100" href="/pricing">
                  Hinnad
                </Link>
              </li>
            ) : null}
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/kontakt">
                Kontakt
              </Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <div className="text-sm font-semibold text-zinc-100">Juriidiline</div>
          <ul className="mt-4 grid gap-2 text-sm">
            {legalLinks.map((item) => (
              <li key={item.href}>
                <Link className="text-zinc-400 hover:text-zinc-100" href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>© {year} Kenneth Alto</div>
          <div className="text-zinc-500">
            Registrikood: lisatakse pärast ettevõtlusvormi valikut · KMKR: lisatakse vajadusel
          </div>
        </div>
      </div>
    </footer>
  );
}

