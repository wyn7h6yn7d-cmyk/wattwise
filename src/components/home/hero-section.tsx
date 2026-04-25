"use client";

import Link from "next/link";
import { DashboardMockup } from "@/components/home/dashboard-mockup";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-emerald-300/20 bg-[#07110f]/80 px-5 py-7 shadow-[0_24px_90px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:px-8 sm:py-9 lg:px-10 lg:py-10">
      <div className="hero-reference-bg" />
      <div className="hero-reference-overlay" />
      <div className="hero-reference-glow" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[0.98fr_1.12fr] lg:gap-8">
        <div className="hero-content-shield">
          <h1 className="mt-4 text-balance text-[2.25rem] font-semibold leading-[1.04] tracking-tight text-zinc-50 sm:text-[3.45rem]">
            Arvuta energiaotsuste <span className="text-emerald-300">tasuvus targemalt</span>
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">
            Päikesejaam, VPP, EV laadimine, elektri hinnavõrdlus ja ärikliendi elektritarbimise analüüs ühes
            platvormis.
          </p>

          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            <Link href="/kalkulaatorid" className="btn-glow inline-flex w-full justify-center sm:w-auto">
              Proovi tasuta
            </Link>
            <Link
              href="/kalkulaatorid"
              className="btn-ghost inline-flex w-full justify-center border-white/20 bg-white/[0.02] sm:w-auto"
            >
              Vaata kalkulaatoreid
            </Link>
          </div>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
            {[
              ["Usaldusväärsed arvutused", "Täpsed metoodikad ja andmed"],
              ["Reaalajas andmed", "Nord Pool börsihind LIVE"],
              ["Sinu andmed on turvalised", "Privaatsus ja andmekaitse tagatud"],
            ].map(([title, description]) => (
              <div key={title} className="rounded-xl border border-emerald-300/20 bg-zinc-950/45 px-3 py-2.5">
                <div className="text-xs font-medium text-zinc-100">{title}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-zinc-400">{description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 lg:pl-2">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

