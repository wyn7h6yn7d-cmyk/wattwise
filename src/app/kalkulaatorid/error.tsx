"use client";

export default function KalkulaatoridError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section>
      <h1 className="text-2xl font-semibold text-zinc-50">Kalkulaatori laadimisel tekkis tõrge</h1>
      <p className="mt-2 text-sm text-zinc-300">
        Midagi läks valesti. Proovi leht uuesti laadida või vajuta allolevat nuppu.
      </p>
      <button type="button" className="btn-glow mt-4" onClick={() => reset()}>
        Proovi uuesti
      </button>
      <p className="mt-3 text-xs text-zinc-500">
        {error?.digest ? `Veakood: ${error.digest}` : "Kui probleem kordub, kirjuta meile kontakti kaudu."}
      </p>
    </section>
  );
}

