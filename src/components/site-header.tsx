"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

const nav = [
  { href: "/", label: "Avaleht" },
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navItems = useMemo(() => {
    return nav.map((item) => {
      const active =
        (item.href === "/" ? pathname === "/" : pathname === item.href || pathname?.startsWith(item.href + "/"));
      return { ...item, active };
    });
  }, [pathname]);

  const calcActive = pathname?.startsWith("/kalkulaatorid") ?? false;

  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const openDropdown = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setDropdownOpen(true);
  };

  const scheduleDropdownClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setDropdownOpen(false);
      closeTimerRef.current = null;
    }, 280);
  };

  return (
    <header className="sticky top-0 z-50 overflow-x-clip px-3 pb-2 pt-2 sm:px-5 sm:pb-3 sm:pt-3 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-2 rounded-2xl border border-emerald-300/22 bg-zinc-950/68 px-2.5 py-2 shadow-[0_14px_52px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:px-4 lg:grid lg:grid-cols-[auto,1fr,auto] lg:gap-3 lg:rounded-3xl lg:px-5 lg:py-2.5">
        <Link
          href="/"
          className="flex min-w-0 max-w-[calc(100%-3.75rem)] items-center gap-2 sm:gap-3"
          onClick={() => setMobileOpen(false)}
          aria-label="Energiakalkulaator avalehele"
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] sm:h-11 sm:w-11">
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
          <div className="truncate text-[0.92rem] font-medium tracking-tight text-zinc-100 min-[430px]:text-sm sm:text-[1.05rem]">
            Energiakalkulaator
          </div>
        </Link>

        <nav className="hidden items-center justify-center gap-1 lg:flex" aria-label="Peamenüü">
          {navItems.slice(0, 1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
                item.active
                  ? "bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-300/30"
                  : "text-zinc-300 hover:bg-white/7 hover:text-zinc-50"
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={openDropdown}
            onMouseLeave={scheduleDropdownClose}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition-colors ${
                calcActive || dropdownOpen
                  ? "bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-300/30"
                  : "text-zinc-300 hover:bg-white/7 hover:text-zinc-50"
              }`}
              onClick={() => setDropdownOpen((v) => !v)}
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
            >
              Kalkulaatorid
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <div
              className={`absolute left-0 top-full z-50 w-[21rem] pt-2 transition-all duration-220 ease-out ${
                dropdownOpen
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-1 opacity-0"
              }`}
            >
              <div className="rounded-2xl border border-emerald-300/20 bg-zinc-950/88 p-2 shadow-[0_22px_65px_rgba(0,0,0,0.58)] backdrop-blur-2xl">
                {calculatorLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-xl px-3 py-2.5 transition hover:bg-emerald-400/12 hover:text-emerald-100"
                  >
                    <div className="text-sm font-medium text-zinc-100">{link.label}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-zinc-400">{link.description}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {navItems.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
                item.active
                  ? "bg-emerald-400/12 text-emerald-200 ring-1 ring-emerald-300/30"
                  : "text-zinc-300 hover:bg-white/7 hover:text-zinc-50"
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
          <Link
            href="/kalkulaatorid"
            className="btn-glow hidden whitespace-nowrap px-4 py-1.5 text-sm lg:inline-flex"
          >
            Alusta tasuta
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
            {navItems.slice(0, 1).map((item) => (
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
            {navItems.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`block rounded-xl px-3 py-3.5 text-sm transition-colors ${
                  item.active
                    ? "bg-emerald-400/20 text-emerald-100"
                    : "text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-2 border-t border-white/10 p-2">
            <Link href="/kalkulaatorid" onClick={onClose} className="btn-glow w-full justify-center">
              Alusta tasuta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

