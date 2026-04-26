"use client";

type Props = {
  open: boolean;
  analytics: boolean;
  functional: boolean;
  onClose: () => void;
  onSave: (next: { analytics: boolean; functional: boolean }) => void;
  onAcceptAll: () => void;
  onRejectOptional: () => void;
  onToggleAnalytics: (value: boolean) => void;
  onToggleFunctional: (value: boolean) => void;
};

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        disabled
          ? "cursor-not-allowed bg-zinc-600/60"
          : checked
            ? "bg-emerald-400/80"
            : "bg-zinc-600"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function CookieSettingsModal({
  open,
  analytics,
  functional,
  onClose,
  onSave,
  onAcceptAll,
  onRejectOptional,
  onToggleAnalytics,
  onToggleFunctional,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-zinc-950/70 p-3 sm:items-center sm:p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-emerald-300/30 bg-zinc-900 p-4 text-zinc-200 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-50">Küpsiste seaded</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Vali, milliseid küpsiste kategooriaid lubad. Hädavajalikud küpsised on alati aktiivsed.
            </p>
          </div>
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={onClose}>
            Sulge
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-zinc-100">Hädavajalikud küpsised</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Vajalikud veebilehe tööks, turvalisuseks ja kasutaja valikute salvestamiseks.
                </p>
              </div>
              <Toggle checked disabled onChange={() => undefined} />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-zinc-100">Analüütika küpsised</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Aitavad mõista, kuidas lehte kasutatakse. Kasutame ainult sinu nõusolekul.
                </p>
              </div>
              <Toggle checked={analytics} onChange={onToggleAnalytics} />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-zinc-100">Funktsionaalsed küpsised</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Võivad aidata salvestada sinu eelistusi, et kasutuskogemus oleks mugavam.
                </p>
              </div>
              <Toggle checked={functional} onChange={onToggleFunctional} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-glow"
            onClick={() => onSave({ analytics, functional })}
          >
            Salvesta valikud
          </button>
          <button type="button" className="btn-ghost" onClick={onAcceptAll}>
            Nõustun kõigiga
          </button>
          <button type="button" className="btn-ghost" onClick={onRejectOptional}>
            Keeldun lisaküpsistest
          </button>
        </div>
      </div>
    </div>
  );
}

