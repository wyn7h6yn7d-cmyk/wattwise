"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FEATURES } from "@/lib/features";

const nav = [
  { href: "/", label: "Avaleht" },
  { href: "/kalkulaatorid", label: "Kalkulaatorid" },
  ...(FEATURES.paywallEnabled ? ([{ href: "/pricing", label: "Hinnad" }] as const) : ([] as const)),
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = useMemo(() => {
    return nav.map((item) => {
      const active =
        (item.href === "/" ? pathname === "/" : pathname === item.href || pathname?.startsWith(item.href + "/"));
      return { ...item, active };
    });
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3"
          onClick={() => setMobileOpen(false)}
          aria-label="Energiakalkulaator avalehele"
        >
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/55 shadow-[0_0_26px_rgba(16,185,129,0.22)] sm:h-14 sm:w-14">
            <Image
              src="/logo.png"
              alt="Energiakalkulaator"
              width={56}
              height={56}
              sizes="(min-width: 640px) 56px, 44px"
              quality={100}
              unoptimized
              className="h-[92%] w-[92%] object-contain"
              priority
            />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-[15px] font-semibold leading-tight tracking-tight text-zinc-50 sm:text-lg">
              Energiakalkulaator
            </div>
            {/* Tagline eemaldatud (nõue: ainult Energiakalkulaator) */}
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Peamenüü">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-sm transition-colors ${
                item.active
                  ? "bg-white/10 text-zinc-50"
                  : "text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-zinc-100 shadow-[0_0_24px_rgba(16,185,129,0.08)] backdrop-blur-xl transition-colors hover:bg-white/[0.06] md:hidden"
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
            className="btn-glow inline-flex whitespace-nowrap px-4 py-2.5 sm:px-[1.1rem] sm:py-[0.7rem]"
          >
            Proovi
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <MobileMenu items={items} onClose={() => setMobileOpen(false)} />
      ) : null}
    </header>
  );
}

function MobileMenu({
  items,
  onClose,
}: {
  items: Array<{ href: string; label: string; active: boolean }>;
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
    <div className="md:hidden">
      <div
        className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-xl"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-50 mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/82 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="text-sm font-semibold text-zinc-50">Menüü</div>
            <button type="button" className="btn-ghost" onClick={onClose} aria-label="Sulge menüü">
              Sulge
            </button>
          </div>

          <div className="grid gap-1 p-2">
            {items.map((item) => (
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
          </div>

          <div className="mt-2 border-t border-white/10 p-2">
            <Link href="/kalkulaatorid" onClick={onClose} className="btn-glow w-full justify-center">
              Proovi kalkulaatorit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

