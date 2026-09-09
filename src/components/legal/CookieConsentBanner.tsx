"use client";

type Props = {
  onAcceptAll: () => void;
  onRejectOptional: () => void;
  onManage: () => void;
};

export function CookieConsentBanner({ onAcceptAll, onRejectOptional, onManage }: Props) {
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4">
      <div className="mx-auto w-full max-w-4xl rounded-xl border border-zinc-800 bg-zinc-950 p-4">
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

