import { ElektripaketidPageClient } from "@/components/elektripaketid-page";
import { Suspense } from "react";

export default function ElektripaketidPage() {
  return (
    <Suspense fallback={<div className="card text-sm text-zinc-300">Kalkulaator avaneb...</div>}>
      <ElektripaketidPageClient />
    </Suspense>
  );
}

