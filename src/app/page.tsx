import Link from "next/link";
import { AnimatedEnergyBackground } from "@/components/animated-energy-background";

export default function Home() {
  const tools = [
    {
      title: "Päikesejaam",
      description: "Vaata kiiresti, kas päikesejaam võiks sinu olukorras mõistlik olla.",
      href: "/kalkulaatorid/paikesejaam",
      icon: "PV",
    },
    {
      title: "Börsihind",
      description: "Näe, millal elekter on odavam ja millal tasub tarbimist vähendada.",
      href: "/borsihind",
      icon: "BP",
    },
    {
      title: "EV laadimine",
      description: "Leia soodsamad laadimistunnid ja hinda, kui palju laadimine maksma läheb.",
      href: "/kalkulaatorid/ev-laadimine",
      icon: "EV",
    },
    {
      title: "Elektripaketid",
      description: "Võrdle spot- ja fikseeritud paketti oma tegelike andmete põhjal.",
      href: "/kalkulaatorid/elektripaketid",
      icon: "EP",
    },
    {
      title: "Peak shaving",
      description: "Hinda, kas tipukoormuse vähendamine aitaks sinu kulusid alla tuua.",
      href: "/kalkulaatorid/peak-shaving",
      icon: "PS",
    },
  ];

  return (
    <div className="relative page-bg page-bg-static">
      <main className="relative mx-auto w-full max-w-7xl px-3 pb-14 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 lg:pt-12">
        <section className="relative overflow-hidden rounded-[1.7rem] border border-emerald-300/30 bg-[#050d0a] px-4 py-8 shadow-[0_30px_100px_rgba(0,0,0,0.62)] sm:rounded-[2rem] sm:px-8 sm:py-11 lg:px-10 lg:py-12">
          <AnimatedEnergyBackground />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(95deg,rgba(5,13,10,0.96)_0%,rgba(5,13,10,0.9)_40%,rgba(5,13,10,0.5)_72%,rgba(5,13,10,0.22)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(16,185,129,0.36),transparent_40%),radial-gradient(circle_at_90%_70%,rgba(45,212,191,0.24),transparent_42%),radial-gradient(circle_at_64%_58%,rgba(99,102,241,0.18),transparent_44%)]" />
          <div className="pointer-events-none absolute inset-y-8 right-4 hidden w-[44%] rounded-[1.2rem] border border-emerald-300/24 bg-[linear-gradient(140deg,rgba(45,212,191,0.12)_0%,rgba(59,130,246,0.1)_52%,rgba(16,185,129,0.08)_100%)] sm:block" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="min-w-0">
              <p className="inline-flex items-center rounded-full border border-emerald-300/35 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-200">
                Tasuta beetaversioon
              </p>
              <h1 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.04] tracking-tight text-zinc-50 min-[390px]:text-[2.2rem] sm:text-[3.8rem]">
                Arvuta energiaotsuste{" "}
                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-lime-200 bg-clip-text text-transparent">
                  tasuvus targemalt
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">
                Vaata kiiresti, kas päikesejaam, aku või elektripaketi vahetus võiks sinu olukorras mõistlik olla.
              </p>

              <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
                <Link href="/kalkulaatorid" className="btn-glow inline-flex w-full justify-center px-6 py-3 sm:w-auto">
                  Proovi kalkulaatorit
                </Link>
                <Link
                  href="/borsihind"
                  className="btn-ghost inline-flex w-full justify-center border-emerald-300/28 bg-white/[0.03] px-6 py-3 sm:w-auto"
                >
                  Jälgi börsihinda
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[34rem] min-w-0 overflow-hidden rounded-[1.35rem] border border-emerald-300/30 bg-zinc-950/82 p-3 shadow-[0_0_0_1px_rgba(16,185,129,0.12),0_28px_80px_rgba(0,0,0,0.62),0_0_56px_rgba(16,185,129,0.16)] backdrop-blur-sm sm:p-4 lg:max-w-none">
              <div className="pointer-events-none absolute -inset-px rounded-[1.35rem] ring-1 ring-emerald-300/20" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_34%)] opacity-45" />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-400/12 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    LIVE
                  </div>
                  <div className="text-[11px] text-zinc-500">Uuendub reaalajas</div>
                </div>

                <div className="min-w-0 rounded-xl border border-emerald-300/26 bg-white/[0.03] px-3 py-3.5">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-400">Praegune hind</p>
                  <p className="mt-1 truncate text-2xl font-semibold text-zinc-50">11.6 snt/kWh</p>
                  <p className="mt-1 text-xs text-emerald-200">Andmed uuenevad jooksvalt Eesti piirkonna alusel.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-xl border border-emerald-300/22 bg-white/[0.02] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs text-zinc-300">Hinnagraafik</p>
                      <p className="text-[11px] text-zinc-500">24h</p>
                    </div>
                    <div className="h-28 w-full overflow-hidden rounded-lg bg-zinc-950/70 px-2 py-2">
                      <svg viewBox="0 0 320 110" className="h-full w-full" aria-hidden="true">
                        <defs>
                          <linearGradient id="priceLine" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0" stopColor="rgba(16,185,129,0.95)" />
                            <stop offset="1" stopColor="rgba(45,212,191,0.88)" />
                          </linearGradient>
                        </defs>
                        <path d="M6 96 L314 96" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
                        <path
                          d="M8 92 C38 68, 66 76, 92 55 C118 34, 148 62, 174 44 C202 26, 232 36, 258 20 C276 10, 296 18, 312 14"
                          fill="none"
                          stroke="url(#priceLine)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          className="hero-chart-line"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-300/22 bg-white/[0.02] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-400">Tänane efektiivsus</p>
                    <div className="mt-3 flex items-center justify-center">
                      <div
                        className="relative h-24 w-24 rounded-full"
                        style={{
                          background:
                            "conic-gradient(rgba(45,212,191,0.92) 0deg, rgba(16,185,129,0.9) 266deg, rgba(255,255,255,0.08) 266deg 360deg)",
                        }}
                      >
                        <div className="absolute inset-[9px] rounded-full bg-zinc-950/95" />
                        <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-zinc-100">74%</div>
                      </div>
                    </div>
                    <p className="mt-3 text-center text-xs text-emerald-200">Hinnanguline kasutegur</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="min-w-0 rounded-xl border border-emerald-300/22 bg-white/[0.03] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-400">Aastane sääst</p>
                    <p className="mt-1 truncate text-base font-semibold text-zinc-100">+1 240 €</p>
                  </div>
                  <div className="min-w-0 rounded-xl border border-emerald-300/22 bg-white/[0.03] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-400">Odavaim laadimisaken</p>
                    <p className="mt-1 truncate text-base font-semibold text-zinc-100">00:00-05:00</p>
                  </div>
                  <div className="min-w-0 rounded-xl border border-emerald-300/22 bg-white/[0.03] px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-400">Päikeseenergia potentsiaal</p>
                    <p className="mt-1 truncate text-base font-semibold text-zinc-100">34.2 kWh</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-emerald-300/24 bg-zinc-950/72 p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-200">Live energy strip</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-medium text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Näidisvaade
            </span>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-emerald-300/22 bg-white/[0.02] px-3 py-2.5">
              <div className="text-zinc-400">Praegune börsihind</div>
              <div className="mt-1 text-lg font-semibold text-emerald-200">11.6 snt/kWh</div>
            </div>
            <div className="rounded-xl border border-emerald-300/22 bg-white/[0.02] px-3 py-2.5">
              <div className="text-zinc-400">Odavaim tund täna</div>
              <div className="mt-1 text-lg font-semibold text-emerald-200">03:00 · 8.9 snt/kWh</div>
            </div>
            <div className="rounded-xl border border-emerald-300/22 bg-white/[0.02] px-3 py-2.5">
              <div className="text-zinc-400">Homne keskmine hind</div>
              <div className="mt-1 text-lg font-semibold text-emerald-200">10.8 snt/kWh</div>
            </div>
            <div className="rounded-xl border border-emerald-300/22 bg-white/[0.02] px-3 py-2.5">
              <div className="text-zinc-400">Päikeseenergia potentsiaal</div>
              <div className="mt-1 text-lg font-semibold text-emerald-200">34.2 kWh</div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-[2rem]">Vali tööriist</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300 sm:text-base">
              Arvutused põhinevad sisestatud andmetel ja valitud eeldustel.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {tools.map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                className="group min-w-0 overflow-hidden rounded-2xl border border-emerald-300/24 bg-zinc-950/68 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.36)] transition duration-200 hover:border-emerald-300/50 hover:shadow-[0_16px_36px_rgba(0,0,0,0.44),0_0_28px_rgba(16,185,129,0.18)]"
              >
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-300/34 bg-emerald-400/10 text-xs font-semibold tracking-wide text-emerald-200">
                  {tool.icon}
                </div>
                <h3 className="mt-3 text-base font-semibold text-zinc-100 group-hover:text-emerald-100">{tool.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{tool.description}</p>
                <div className="mt-4 inline-flex items-center text-sm font-medium text-emerald-200">Ava tööriist</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-emerald-300/24 bg-zinc-950/72 p-4 sm:p-5">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-[2rem]">Kuidas see töötab</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["1. Vali tööriist", "Ava kalkulaator, mis vastab sinu küsimusele."],
              ["2. Sisesta andmed", "Lisa oma tarbimine, hinnad ja vajalikud eeldused."],
              ["3. Võrdle tulemust", "Vaata arvutuse tulemust ja otsusta järgmine samm."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-xl border border-emerald-300/22 bg-white/[0.03] p-4">
                <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
