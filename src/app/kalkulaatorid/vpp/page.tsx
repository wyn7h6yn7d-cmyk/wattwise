import { VppPageClient } from "@/components/vpp-page";
import { Suspense } from "react";

export default function VppPage() {
  return (
    <Suspense fallback={<div className="card text-sm text-zinc-300">Kalkulaator avaneb...</div>}>
      <VppPageClient />
    </Suspense>
  );
}

