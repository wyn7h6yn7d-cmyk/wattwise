"use client";

import { ReactNode } from "react";

export function AdvancedInputAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 open:border-emerald-300/30 open:bg-emerald-400/5"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none text-sm font-medium text-zinc-100">
        {title}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}
