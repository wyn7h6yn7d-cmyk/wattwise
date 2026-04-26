"use client";

type Props = {
  onAcceptAll: () => void;
  onRejectOptional: () => void;
  onManage: () => void;
};

export function CookieConsentBanner({ onAcceptAll, onRejectOptional, onManage }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-emerald-300/35 bg-zinc-950/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur">
        <p className="text-sm text-zinc-100">
          Kasutame küpsiseid, et veebileht töötaks korrektselt, mõõta kasutust ja arendada teenust
          paremaks. Hädavajalikud küpsised on alati aktiivsed. Analüütika ja lisaküpsised kasutame
          ainult sinu nõusolekul.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-glow" onClick={onAcceptAll}>
            Nõustun kõigiga
          </button>
          <button type="button" className="btn-ghost" onClick={onRejectOptional}>
            Keeldun lisaküpsistest
          </button>
          <button type="button" className="btn-ghost" onClick={onManage}>
            Halda valikuid
          </button>
        </div>
      </div>
    </div>
  );
}

