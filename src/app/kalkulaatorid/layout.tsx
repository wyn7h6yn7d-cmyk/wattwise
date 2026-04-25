import { CalculatorTabs } from "@/components/calculator-tabs";
import { AnimatedEnergyBackground } from "@/components/animated-energy-background";

export default function KalkulaatoridLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative page-bg">
      <AnimatedEnergyBackground intensity="subtle" />
      <main className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <CalculatorTabs />
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}

