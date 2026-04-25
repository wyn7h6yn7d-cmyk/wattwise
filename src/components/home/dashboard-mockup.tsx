"use client";

export function DashboardMockup() {
  return (
    <div
      className="dashboard-pulse relative overflow-hidden rounded-[1.7rem] border border-emerald-300/35 bg-zinc-950/88 p-3 shadow-[0_28px_78px_rgba(0,0,0,0.62)] backdrop-blur-xl sm:p-4 lg:min-h-[30rem]"
      style={{ contain: "layout paint" }}
    >
      <div className="pointer-events-none absolute -left-10 top-6 hidden h-28 w-28 rounded-full bg-emerald-400/20 blur-2xl sm:block" />
      <div className="pointer-events-none absolute -right-10 bottom-4 hidden h-32 w-32 rounded-full bg-teal-400/18 blur-2xl sm:block" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.1),transparent_28%)] opacity-35" />
      <div className="pointer-events-none absolute inset-0 rounded-[1.7rem] ring-1 ring-emerald-300/20" />

      <div className="relative grid gap-3 lg:grid-cols-[74px_1fr]">
        <aside className="hidden rounded-2xl border border-white/10 bg-white/[0.03] p-2 lg:block">
          <div className="mb-2 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-200">
            Console
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className="h-8 rounded-lg border border-white/10 bg-white/[0.04]"
              />
            ))}
          </div>
        </aside>

        <div className="space-y-3 lg:space-y-3.5">
          <div className="grid gap-2 sm:grid-cols-4">
            {[
              ["Kogutulu", "124 560 €", "+12%"],
              ["IRR", "18,7%", "+1,8pp"],
              ["Tasuvusaeg", "4,2 aastat", "-0,6 a"],
              ["CO₂", "42,8 t", "-18%"],
            ].map(([label, value, delta]) => (
              <div key={label} className="min-w-0 rounded-xl border border-emerald-300/22 bg-white/[0.03] px-3 py-2.5 shadow-[0_0_18px_rgba(16,185,129,0.08)]">
                <div className="truncate text-[11px] uppercase tracking-wide text-zinc-400">{label}</div>
                <div className="mt-1 truncate text-sm font-semibold text-zinc-100">{value}</div>
                <div className="mt-1 text-[10px] text-emerald-200/85">{delta}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[1.35fr_0.7fr]">
            <div className="rounded-2xl border border-emerald-300/24 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-300">Elektri tarbimine ja tootmine</div>
                <div className="text-[10px] text-zinc-500">LIVE / 12 kuud</div>
              </div>
              <div className="mt-3 h-28">
                <svg viewBox="0 0 300 110" className="h-full w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="dashboardLine" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="rgba(16,185,129,0.9)" />
                      <stop offset="1" stopColor="rgba(45,212,191,0.8)" />
                    </linearGradient>
                  </defs>
                  <path d="M10 95 L290 95" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <path
                    d="M8 98 C35 78, 64 90, 88 70 C110 52, 138 76, 162 44 C184 22, 214 40, 242 18 C260 11, 278 22, 292 10"
                    fill="none"
                    stroke="url(#dashboardLine)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 98 C35 82, 64 80, 88 70 C110 62, 138 56, 162 42 C184 30, 214 28, 242 18 C260 12, 278 8, 292 10 L292 106 L8 106 Z"
                    fill="rgba(16,185,129,0.13)"
                  />
                </svg>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-300/24 bg-white/[0.02] p-3">
              <div className="text-xs text-zinc-300">Oma tarbimine</div>
              <div className="mt-2 flex items-center justify-center">
                <div className="relative h-24 w-24 rounded-full border-[10px] border-emerald-300/30">
                  <div className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-emerald-300 border-r-teal-300" />
                  <div className="absolute inset-0 grid place-items-center text-[11px] font-semibold text-zinc-200">74%</div>
                </div>
              </div>
              <div className="mt-2 grid gap-1 text-[11px] text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>Osakaal</span>
                  <span className="text-zinc-200">68%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Allikas</span>
                  <span className="text-zinc-200">72%</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-wide text-zinc-400">Ajakulu profiil (bar chart)</div>
            <div className="grid gap-2 sm:grid-cols-4">
            {[38, 52, 46, 66, 74, 62, 70, 78].map((value, index) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-2"
              >
                <div className="h-12 w-full rounded-md bg-zinc-900/60 p-1">
                  <div
                    className="h-full rounded-sm bg-gradient-to-t from-emerald-400/70 to-teal-300/75"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
