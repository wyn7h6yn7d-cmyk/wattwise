import { ElektripaketidPageClient } from "@/components/elektripaketid-page";
import { Suspense } from "react";

export default function ElektripaketidPage() {
  return (
    <Suspense
      fallback={
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="text-sm text-zinc-300">Laen kalkulaatorit...</div>
        </div>
      }
    >
      <ElektripaketidPageClient />
    </Suspense>
  );
}

