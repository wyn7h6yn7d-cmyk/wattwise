"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/kalkulaatorid/paikesejaam", label: "Päikesejaama tasuvus" },
  { href: "/kalkulaatorid/vpp", label: "VPP tasuvusmudel" },
  { href: "/kalkulaatorid/elektripaketid", label: "Elektripaketi võrdlus" },
  { href: "/kalkulaatorid/ev-laadimine", label: "EV laadimine" },
  { href: "/kalkulaatorid/peak-shaving", label: "Peak shaving" },
];

export function CalculatorTabs() {
  const pathname = usePathname();

  return (
    <div className="glass-panel rounded-3xl p-2">
      <div className="-mx-1 overflow-x-auto px-1 [-webkit-overflow-scrolling:touch]">
        <div className="flex min-w-max gap-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap rounded-2xl px-3 py-1.5 text-xs min-[390px]:text-sm min-[390px]:px-4 min-[390px]:py-2 transition-colors ${
                active
                  ? "bg-gradient-to-r from-emerald-400/20 to-teal-400/20 text-zinc-50 ring-1 ring-emerald-300/25"
                  : "text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
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

