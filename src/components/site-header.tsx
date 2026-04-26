"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { addVat, eurPerKwhToSntPerKwh, formatSntKwh } from "@/lib/elering";

const nav = [
  { href: "/", label: "Avaleht" },
  { href: "/kalkulaatorid", label: "Kalkulaatorid" },
  { href: "/energiaprognoos", label: "Energiaprognoos" },
  { href: "/borsihind", label: "Börsihind" },
  { href: "/pricing", label: "Hinnad" },
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [livePriceSnt, setLivePriceSnt] = useState<number | null>(null);
  const [priceStatus, setPriceStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [sunTimes, setSunTimes] = useState<{ rise: string; set: string } | null>(null);
  const [sunStatus, setSunStatus] = useState<"loading" | "ready" | "unavailable">("loading");

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

  useEffect(() => {
    let cancelled = false;

    const fmtHm = (iso: string) => {
      const d = new Date(iso);
      if (!Number.isFinite(d.getTime())) return "—";
      return d.toLocaleTimeString("et-EE", { hour: "2-digit", minute: "2-digit" });
    };

    const loadHeaderData = async () => {
      if (!cancelled) {
        setPriceStatus("loading");
        setSunStatus("loading");
      }
      try {
        const now = new Date();
        const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        const end = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();

        const [priceRes, sunRes] = await Promise.all([
          fetch(`/api/elering/nps?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&area=ee`),
          fetch("/api/sun"),
        ]);

        if (priceRes.ok) {
          const priceData = (await priceRes.json()) as { points?: Array<{ ts: number; price_eur_per_kwh: number }> };
          const points = priceData.points ?? [];
          if (points.length > 0) {
            const nowTs = Math.floor(Date.now() / 1000);
            const current = points.reduce((best, p) => {
              if (!best) return p;
              return Math.abs(p.ts - nowTs) < Math.abs(best.ts - nowTs) ? p : best;
            }, points[0]);
            const sntWithVat = eurPerKwhToSntPerKwh(addVat(current.price_eur_per_kwh));
            if (!cancelled) {
              setLivePriceSnt(sntWithVat);
              setPriceStatus("ready");
            }
          } else if (!cancelled) {
            setLivePriceSnt(null);
            setPriceStatus("unavailable");
          }
        } else if (!cancelled) {
          setLivePriceSnt(null);
          setPriceStatus("unavailable");
        }

        if (sunRes.ok) {
          const sunData = (await sunRes.json()) as { sunriseIso?: string; sunsetIso?: string };
          if (!cancelled && sunData.sunriseIso && sunData.sunsetIso) {
            setSunTimes({
              rise: fmtHm(sunData.sunriseIso),
              set: fmtHm(sunData.sunsetIso),
            });
            setSunStatus("ready");
          } else if (!cancelled) {
            setSunTimes(null);
            setSunStatus("unavailable");
          }
        } else if (!cancelled) {
          setSunTimes(null);
          setSunStatus("unavailable");
        }
      } catch {
        if (!cancelled) {
          setLivePriceSnt(null);
          setPriceStatus("unavailable");
          setSunTimes(null);
          setSunStatus("unavailable");
        }
      }
    };

    void loadHeaderData();
    const id = window.setInterval(() => void loadHeaderData(), 5 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("et-EE", {
        day: "2-digit",
        month: "2-digit",
      }),
    [],
  );
  const hasPrice = priceStatus === "ready" && Number.isFinite(livePriceSnt);
  const priceValue = hasPrice ? livePriceSnt : null;
  const hasSun = sunStatus === "ready" && !!sunTimes;
  const priceLabel = hasPrice
    ? `${formatSntKwh(priceValue as number)} snt/kWh`
    : priceStatus === "loading"
      ? "Börsihind laeb..."
      : "Börsihind puudub";
  const sunLabel = hasSun
    ? `↑ ${sunTimes!.rise} · ↓ ${sunTimes!.set}`
    : sunStatus === "loading"
      ? "↑ --:-- · ↓ --:--"
      : "↑ --:-- · ↓ --:--";

  return (
    <header className="sticky top-0 z-50 overflow-x-clip px-3 py-2 sm:px-5 sm:py-3 lg:px-8">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl min-w-0 items-center justify-between gap-3 rounded-2xl border border-emerald-300/24 bg-zinc-950/72 px-3 shadow-[0_12px_36px_rgba(0,0,0,0.42),0_0_28px_rgba(16,185,129,0.07)] backdrop-blur-md sm:px-4 lg:h-[78px] lg:px-5">
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
              className="h-[92%] w-[92%] object-contain"
              priority
            />
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="truncate text-[0.9rem] font-medium tracking-tight text-zinc-100 min-[430px]:text-sm sm:text-[1rem]">
              Energiakalkulaator
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full border border-amber-300/40 bg-amber-400/15 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.18)]">
              Beta
            </span>
          </div>
        </Link>

        <nav
          className="max-lg:hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1"
          aria-label="Peamenüü"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-2.5 py-1.5 text-sm transition-colors xl:px-3 ${
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] text-zinc-100 shadow-[0_0_24px_rgba(16,185,129,0.08)] backdrop-blur-md transition-colors hover:bg-white/[0.1] lg:hidden"
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
          <Link href="/kalkulaatorid" className="btn-glow hidden h-11 items-center whitespace-nowrap px-4 text-sm xl:inline-flex">
            Proovi tasuta
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-2 flex w-full max-w-7xl items-center justify-center gap-1.5 rounded-xl border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(9,20,17,0.82),rgba(7,16,13,0.76))] px-3 py-2 text-[11px] text-zinc-200 shadow-[0_8px_24px_rgba(0,0,0,0.32)]">
        <span className="rounded-md bg-white/[0.03] px-2 py-0.5 text-zinc-400">{todayLabel}</span>
        <span className="text-zinc-600">|</span>
        <strong className="rounded-md bg-emerald-400/10 px-2 py-0.5 text-emerald-200">{priceLabel}</strong>
        <span className="text-zinc-600">|</span>
        <span className="rounded-md bg-white/[0.03] px-1.5 py-0.5">{sunLabel}</span>
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
        className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-50 mx-auto max-w-7xl px-3 pb-4 pt-2 sm:px-5 lg:px-8">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-white/12 bg-zinc-950/88 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-emerald-300/45 shadow-[0_0_16px_rgba(16,185,129,0.2)]">
                <Image
                  src="/logo.png"
                  alt="Energiakalkulaator"
                  width={32}
                  height={32}
                  sizes="32px"
                  className="h-[92%] w-[92%] object-contain"
                />
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <div className="truncate text-sm font-semibold text-zinc-50 max-[390px]:text-xs">Energiakalkulaator</div>
                <span className="inline-flex shrink-0 items-center rounded-full border border-amber-300/40 bg-amber-400/15 px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-amber-100">
                  Beta
                </span>
              </div>
            </div>
            <button type="button" className="btn-ghost shrink-0" onClick={onClose} aria-label="Sulge menüü">
              Sulge
            </button>
          </div>

          <div className="grid gap-1 p-2">
            {navItems.map((item) => (
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

