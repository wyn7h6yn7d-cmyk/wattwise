import { HeroSection } from "@/components/home/hero-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { ToolCardsSection } from "@/components/home/tool-cards-section";

export default function Home() {
  return (
    <div className="relative page-bg">
      <main className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pt-12">
        <div className="space-y-14 sm:space-y-20">
          <HeroSection />
          <ToolCardsSection />
          <HowItWorksSection />
        </div>
      </main>
    </div>
  );
}
