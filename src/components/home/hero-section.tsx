"use client";

import Link from "next/link";
import { AnimatedEnergyBackground } from "@/components/animated-energy-background";
import { DashboardMockup } from "@/components/home/dashboard-mockup";
import { RenewableEnergyScene } from "@/components/home/renewable-energy-scene";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden rounded-[1.5rem] border border-emerald-300/30 bg-[#030a08] px-4 py-8 shadow-[0_34px_120px_rgba(0,0,0,0.68)] sm:rounded-[2rem] sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <AnimatedEnergyBackground intensity="hero" />
      <RenewableEnergyScene />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,10,8,0.92)_0%,rgba(3,10,8,0.84)_36%,rgba(3,10,8,0.42)_60%,rgba(3,10,8,0.14)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(16,185,129,0.3),transparent_40%),radial-gradient(circle_at_90%_70%,rgba(20,184,166,0.22),transparent_36%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.0)_34%)] opacity-35" />
      <div className="pointer-events-none absolute -right-16 top-6 hidden h-[420px] w-[540px] rounded-full border border-emerald-300/30 opacity-80 blur-[0.8px] sm:block" />
      <div className="pointer-events-none absolute -right-10 top-12 hidden h-[420px] w-[540px] rounded-full border-2 border-emerald-300/45 opacity-75 shadow-[0_0_82px_rgba(16,185,129,0.28)] sm:block" />

      <div className="relative grid items-center gap-8 lg:min-h-[31rem] lg:grid-cols-[0.98fr_1.12fr] lg:gap-8">
        <div className="hero-content-shield">
          <h1 className="text-balance text-[2rem] font-semibold leading-[1.03] tracking-tight text-zinc-50 min-[390px]:text-[2.2rem] sm:text-[4rem]">
            Arvuta energiaotsuste{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-200 bg-clip-text text-transparent">
              tasuvus targemalt
            </span>
          </h1>
          <p className="mt-4 max-w-lg text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">
            Premium tööriistad energiaotsuste hindamiseks - selge tulemus, tugev visuaal, kiire algus.
          </p>

          <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-3.5">
            <Link href="/kalkulaatorid" className="btn-glow inline-flex w-full justify-center px-6 py-3 sm:w-auto">
              Proovi tasuta
            </Link>
            <Link
              href="/kalkulaatorid"
              className="btn-ghost inline-flex w-full justify-center border-emerald-300/30 bg-white/[0.03] px-6 py-3 sm:w-auto"
            >
              Vaata kalkulaatoreid
            </Link>
          </div>
        </div>

        <div className="min-w-0 lg:pl-2">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

