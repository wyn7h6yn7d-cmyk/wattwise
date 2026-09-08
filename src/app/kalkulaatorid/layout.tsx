import { CalculatorTabs } from "@/components/calculator-tabs";

export default function KalkulaatoridLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="site-board">
        <CalculatorTabs />
        <div className="border-t border-[var(--panel-border)] p-5 sm:p-8">{children}</div>
      </div>
    </main>
  );
}
