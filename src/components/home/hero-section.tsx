"use client";

import Link from "next/link";
import { DashboardMockup } from "@/components/home/dashboard-mockup";

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden rounded-[1.5rem] border border-emerald-300/30 bg-[#030a08] px-4 py-8 shadow-[0_34px_120px_rgba(0,0,0,0.68)] sm:rounded-[2rem] sm:px-8 sm:py-12 lg:px-10 lg:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,10,8,0.93)_0%,rgba(3,10,8,0.86)_35%,rgba(3,10,8,0.55)_62%,rgba(3,10,8,0.24)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(16,185,129,0.34),transparent_40%),radial-gradient(circle_at_92%_70%,rgba(20,184,166,0.24),transparent_38%),radial-gradient(circle_at_70%_62%,rgba(99,102,241,0.2),transparent_44%),radial-gradient(circle_at_56%_14%,rgba(217,70,239,0.14),transparent_46%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.0)_34%)] opacity-35" />
      <div className="pointer-events-none absolute inset-y-6 right-4 hidden w-[44%] rounded-[1.2rem] border border-cyan-300/20 bg-[linear-gradient(140deg,rgba(45,212,191,0.12)_0%,rgba(59,130,246,0.08)_48%,rgba(217,70,239,0.08)_100%)] sm:block" />
      <div className="pointer-events-none absolute inset-y-10 right-7 hidden w-[40%] rounded-[1.1rem] ring-1 ring-emerald-300/18 sm:block" />

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

