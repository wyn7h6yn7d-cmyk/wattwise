import { CalculatorTabs } from "@/components/calculator-tabs";
import { AnimatedEnergyBackground } from "@/components/animated-energy-background";

export default function KalkulaatoridLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative page-bg">
      <AnimatedEnergyBackground intensity="page" />
      <main className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">Kalkulaatorid</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Ühtne hub sinu energiaotsuste jaoks. Vali moodul ja arvuta.
          </p>
        </div>
        <CalculatorTabs />
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}

