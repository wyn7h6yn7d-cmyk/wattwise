"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PUBLIC_CALCULATOR_TABS } from "@/lib/nav";

export function CalculatorTabs() {
  const pathname = usePathname();

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-1.5">
      <div className="-mx-1 overflow-x-auto px-1 [-webkit-overflow-scrolling:touch]">
        <div className="flex min-w-max gap-1">
        {PUBLIC_CALCULATOR_TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs min-[390px]:text-sm min-[390px]:px-4 min-[390px]:py-2 transition-colors ${
                active
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
        </div>
      </div>
    </div>
  );
}
