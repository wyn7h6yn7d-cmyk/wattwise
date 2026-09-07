"use client";

import { ReactNode, useLayoutEffect, useRef } from "react";

export function AdvancedInputAccordion({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.open = defaultOpen;
  }, [defaultOpen]);

  return (
    <details
      ref={ref}
      className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
    >
      <summary className="cursor-pointer list-none rounded-lg px-1 py-1 text-sm font-medium text-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 [&::-webkit-details-marker]:hidden">
        {title}
      </summary>
      <div className="mt-4 min-w-0 space-y-1 pt-1">{children}</div>
    </details>
  );
}
