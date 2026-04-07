"use client";

import { ReactNode } from "react";

export function PaywallCard({
  locked,
  title,
  description,
  ctaLabel,
  secondaryLabel,
  onCta,
  onSecondary,
  children,
  footer,
}: {
  locked: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  secondaryLabel?: string;
  onCta: () => void;
  onSecondary?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
      <div className={locked ? "pointer-events-none select-none blur-[10px] opacity-35" : ""}>
        <div className="p-6 sm:p-8">{children}</div>
      </div>

      {locked ? (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-zinc-950/78 to-zinc-950/70 backdrop-blur-2xl" />
          <div className="relative w-full max-w-xl rounded-3xl border border-white/12 bg-zinc-950/75 p-6 shadow-[0_0_70px_rgba(16,185,129,0.14)] ring-1 ring-emerald-300/10 backdrop-blur-2xl">
            <p className="text-sm text-zinc-200">
              <strong>{title}</strong> — {description}
            </p>
            <p className="mt-2 text-xs text-zinc-400">
              See vaade avaneb pärast Täisanalüüsi ostu.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn-glow" onClick={onCta}>
                {ctaLabel}
              </button>
              {secondaryLabel && onSecondary ? (
                <button type="button" className="btn-ghost" onClick={onSecondary}>
                  {secondaryLabel}
                </button>
              ) : null}
            </div>
            {footer ? <div className="mt-3 text-xs text-zinc-400">{footer}</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

