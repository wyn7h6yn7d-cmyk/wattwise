"use client";

import Link from "next/link";
import { AnimatedEnergyBackground } from "@/components/animated-energy-background";
import { DashboardMockup } from "@/components/home/dashboard-mockup";
import { RenewableEnergyScene } from "@/components/home/renewable-energy-scene";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:px-8 sm:py-9 lg:px-10 lg:py-10">
      <RenewableEnergyScene />
      <AnimatedEnergyBackground intensity="hero" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.08fr] lg:gap-10">
        <div className="hero-content-shield">
          <p className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs tracking-wide text-emerald-100">
            Energiakalkulaator
          </p>
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
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
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

