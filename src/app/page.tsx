import { AnimatedEnergyBackground } from "@/components/animated-energy-background";
import { HeroSection } from "@/components/home/hero-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { CalculatorGrid } from "@/components/home/calculator-grid";
import { ValuePropsSection } from "@/components/home/value-props-section";
import { FullAnalysisSection } from "@/components/home/full-analysis-section";
import { FAQSection } from "@/components/home/faq-section";

export default function Home() {
  return (
    <div className="relative page-bg">
      <AnimatedEnergyBackground intensity="page" />

      <main className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="stack">
          <HeroSection />
          <HowItWorksSection />
          <CalculatorGrid />
          <ValuePropsSection />
          <FullAnalysisSection />
          <FAQSection />
        </div>
      </main>
    </div>
  );
}
