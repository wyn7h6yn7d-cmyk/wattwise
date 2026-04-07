"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const nav = [
  { href: "/", label: "Avaleht" },
  { href: "/kalkulaatorid", label: "Kalkulaatorid" },
  { href: "/pricing", label: "Hinnad" },
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
          aria-label="Energiakalkulaator avalehele"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 shadow-[0_0_18px_rgba(16,185,129,0.22)]" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-zinc-50">
              Energiakalkulaator
            </div>
            <div className="text-xs text-zinc-400">Rohelise energia otsused</div>
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-ghost inline-flex md:hidden"
            aria-label={mobileOpen ? "Sulge menüü" : "Ava menüü"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            Menüü
          </button>
          <Link href="/kalkulaatorid/paikesejaam" className="btn-glow inline-flex">
            Ava Täisanalüüs
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <div className="md:hidden">
          <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-2 backdrop-blur-xl">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-xl px-3 py-2 text-sm transition-colors ${
                    item.active
                      ? "bg-white/10 text-zinc-50"
                      : "text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-white/10 pt-2">
                <Link
                  href="/kalkulaatorid/paikesejaam"
                  onClick={() => setMobileOpen(false)}
                  className="btn-glow w-full justify-center"
                >
                  Ava Täisanalüüs
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

