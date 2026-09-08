"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PUBLIC_CALCULATOR_TABS } from "@/lib/nav";

export function CalculatorTabs() {
  const pathname = usePathname();

  return (
    <div className="-mx-1 overflow-x-auto px-1 [-webkit-overflow-scrolling:touch]">
      <div className="flex min-w-max border-b border-[var(--panel-border)]">
        {PUBLIC_CALCULATOR_TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap px-3 py-2.5 text-xs transition-colors min-[390px]:px-4 min-[390px]:text-sm ${
                active
                  ? "text-zinc-50 shadow-[inset_0_-2px_0_#34d399]"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
