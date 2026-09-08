"use client";

import { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description?: string;
  controls?: ReactNode;
  children: ReactNode;
  className?: string;
  chartClassName?: string;
};

export function ChartCard({
  title,
  description,
  controls,
  children,
  className = "",
  chartClassName = "",
}: ChartCardProps) {
  return (
    <section className={`rounded-xl border border-zinc-800/80 bg-[var(--panel-bg)] p-4 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-50 sm:text-base">{title}</h3>
          {description ? <p className="mt-1 text-xs text-zinc-400 sm:text-sm">{description}</p> : null}
        </div>
        {controls ? <div className="flex min-w-0 flex-wrap items-center gap-2">{controls}</div> : null}
      </div>
      <div className={`mt-4 w-full min-h-[240px] md:min-h-[320px] ${chartClassName}`}>{children}</div>
    </section>
  );
}
