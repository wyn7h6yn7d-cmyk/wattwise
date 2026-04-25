"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const nav = [
  { href: "/", label: "Avaleht" },
  { href: "/kalkulaatorid", label: "Kalkulaatorid" },
  { href: "/borsihind", label: "Börsihind" },
  { href: "/pricing", label: "Hinnad" },
  { href: "/kontakt", label: "Kontakt" },
];

const calculatorLinks = [
  {
    href: "/kalkulaatorid/paikesejaam",
    label: "Päikesejaam",
    description: "Tasuvus, sääst, omatarve ja tasuvusaeg.",
  },
  {
    href: "/kalkulaatorid/vpp",
    label: "VPP",
    description: "Aku paindlikkuse tulu ja investeeringu tasuvus.",
  },
  {
    href: "/kalkulaatorid/ev-laadimine",
    label: "EV laadimine",
    description: "Laadimise aeg, kulu ja sobiv laadija võimsus.",
  },
  {
    href: "/kalkulaatorid/elektripaketid",
    label: "Elektripaketid",
    description: "Spot vs fikseeritud kulu võrdlus.",
  },
  {
    href: "/kalkulaatorid/peak-shaving",
    label: "Peak shaving",
    description: "Tipukoormuse lõikamine ja võimsustasu sääst.",
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(() => {
    return nav.map((item) => {
      const active =
        (item.href === "/" ? pathname === "/" : pathname === item.href || pathname?.startsWith(item.href + "/"));
      return { ...item, active };
    });
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 overflow-x-clip px-3 py-2 sm:px-5 sm:py-3 lg:px-8">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl min-w-0 items-center justify-between gap-3 rounded-2xl border border-emerald-300/24 bg-zinc-950/72 px-3 shadow-[0_12px_36px_rgba(0,0,0,0.42),0_0_28px_rgba(16,185,129,0.07)] backdrop-blur-xl sm:px-4 lg:h-[78px] lg:px-5">
        <Link
          href="/"
          className="flex min-w-0 max-w-[calc(100%-3.5rem)] items-center gap-2.5 sm:gap-3"
          onClick={() => setMobileOpen(false)}
          aria-label="Energiakalkulaator avalehele"
        >
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-emerald-300/45 shadow-[0_0_18px_rgba(16,185,129,0.16)] sm:h-10 sm:w-10 lg:h-11 lg:w-11">
            <Image
              src="/logo.png"
              alt="Energiakalkulaator"
              width={44}
              height={44}
              sizes="44px"
              quality={100}
              unoptimized
              className="h-[92%] w-[92%] object-contain"
              priority
            />
          </div>
          <div className="truncate text-[0.9rem] font-medium tracking-tight text-zinc-100 min-[430px]:text-sm sm:text-[1rem]">
            Energiakalkulaator
          </div>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex" aria-label="Peamenüü">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                item.active
                  ? "bg-emerald-400/16 text-emerald-100 ring-1 ring-emerald-300/28"
                  : "text-zinc-300 hover:text-zinc-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] text-zinc-100 shadow-[0_0_24px_rgba(16,185,129,0.08)] backdrop-blur-xl transition-colors hover:bg-white/[0.1] lg:hidden"
            aria-label={mobileOpen ? "Sulge menüü" : "Ava menüü"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="sr-only">Menüü</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M5 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <Link href="/kalkulaatorid" className="btn-glow hidden h-11 items-center whitespace-nowrap px-4 text-sm lg:inline-flex">
            Proovi tasuta
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <MobileMenu navItems={navItems} onClose={() => setMobileOpen(false)} />
      ) : null}
    </header>
  );
}

function MobileMenu({
  navItems,
  onClose,
}: {
  navItems: Array<{ href: string; label: string; active: boolean }>;
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="lg:hidden">
      <div
        className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-xl"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-50 mx-auto max-w-7xl px-3 pb-4 pt-2 sm:px-5 lg:px-8">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-white/12 bg-zinc-950/88 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-emerald-300/45 shadow-[0_0_16px_rgba(16,185,129,0.2)]">
                <Image
                  src="/logo.png"
                  alt="Energiakalkulaator"
                  width={32}
                  height={32}
                  sizes="32px"
                  quality={100}
                  unoptimized
                  className="h-[92%] w-[92%] object-contain"
                />
              </div>
              <div className="truncate text-sm font-semibold text-zinc-50 max-[390px]:text-xs">Energiakalkulaator</div>
            </div>
            <button type="button" className="btn-ghost shrink-0" onClick={onClose} aria-label="Sulge menüü">
              Sulge
            </button>
          </div>

          <div className="grid gap-1 p-2">
            {navItems.filter((item) => item.href !== "/kalkulaatorid").map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`block rounded-xl px-3 py-3.5 text-sm transition-colors ${
                  item.active
                    ? "bg-white/10 text-zinc-50"
                    : "text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
              <div className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">Kalkulaatorid</div>
              <div className="grid gap-1">
                {calculatorLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="block rounded-lg px-3 py-3 transition hover:bg-emerald-400/12 hover:text-emerald-100"
                  >
                    <div className="text-sm font-medium text-zinc-100">{item.label}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-zinc-400">{item.description}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 border-t border-white/10 p-2">
            <Link href="/kalkulaatorid" onClick={onClose} className="btn-glow w-full justify-center">
              Proovi tasuta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

