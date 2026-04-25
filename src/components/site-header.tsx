"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const nav = [
  { href: "/", label: "Avaleht" },
  { href: "/borsihind", label: "Börsihind" },
  { href: "/pricing", label: "Hinnad" },
  { href: "/kontakt", label: "Kontakt" },
];

const calculatorLinks = [
  { href: "/kalkulaatorid/paikesejaam", label: "Päikesejaam" },
  { href: "/kalkulaatorid/vpp", label: "VPP" },
  { href: "/kalkulaatorid/ev-laadimine", label: "EV laadimine" },
  { href: "/kalkulaatorid/elektripaketid", label: "Elektripaketid" },
  { href: "/kalkulaatorid/peak-shaving", label: "Peak shaving" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 px-3 pb-2 pt-3 sm:px-5 sm:pb-3 sm:pt-4 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 rounded-2xl border border-white/15 bg-zinc-950/70 px-3 py-2 shadow-[0_12px_50px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:px-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 sm:gap-3"
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
          <div className="truncate text-sm font-semibold tracking-tight text-zinc-50 sm:text-base">Energiakalkulaator</div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Peamenüü">
          {navItems.slice(0, 1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                item.active
                  ? "bg-emerald-400/20 text-emerald-100"
                  : "text-zinc-300 hover:bg-white/7 hover:text-zinc-50"
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${
                calcActive || dropdownOpen
                  ? "bg-emerald-400/20 text-emerald-100"
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

            {dropdownOpen ? (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-white/15 bg-zinc-950/90 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                {calculatorLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/7 hover:text-emerald-100"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {navItems.slice(1).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                item.active
                  ? "bg-emerald-400/20 text-emerald-100"
                  : "text-zinc-300 hover:bg-white/7 hover:text-zinc-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-zinc-100 shadow-[0_0_24px_rgba(16,185,129,0.08)] backdrop-blur-xl transition-colors hover:bg-white/[0.06] lg:hidden"
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
            className="btn-glow hidden whitespace-nowrap px-4 py-2 text-sm lg:inline-flex"
          >
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
        <div className="rounded-2xl border border-white/12 bg-zinc-950/88 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="text-sm font-semibold text-zinc-50">Menüü</div>
            <button type="button" className="btn-ghost" onClick={onClose} aria-label="Sulge menüü">
              Sulge
            </button>
          </div>

          <div className="grid gap-1 p-2">
            {navItems.slice(0, 1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`block rounded-xl px-3 py-3 text-sm transition-colors ${
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
                    className="block rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/7 hover:text-emerald-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            {navItems.slice(1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`block rounded-xl px-3 py-3 text-sm transition-colors ${
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
              Proovi tasuta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

