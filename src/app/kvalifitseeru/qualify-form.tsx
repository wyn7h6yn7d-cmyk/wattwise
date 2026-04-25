"use client";

import { useMemo, useState } from "react";

type Intent = "paikesejaam" | "akupank" | "soojuspump" | "muu";
type Timeline = "0-1" | "1-3" | "3-6" | "6+";

type FormState = {
  name: string;
  email: string;
  phone: string;
  location: string;
  monthlyKwh: string;
  roof: "plekk" | "kivi" | "eterniit" | "lame" | "maa" | "ei-tea";
  intent: Intent;
  timeline: Timeline;
  notes: string;
  consent: boolean;
};

const DEFAULTS: FormState = {
  name: "",
  email: "",
  phone: "",
  location: "",
  monthlyKwh: "",
  roof: "ei-tea",
  intent: "paikesejaam",
  timeline: "1-3",
  notes: "",
  consent: false,
};

function safeNumber(input: string) {
  const n = Number(String(input).replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

function buildMailto(state: FormState) {
  const subject = `Kvalifitseerimise päring – ${state.intent}`;
  const lines = [
    "Tere!",
    "",
    "Soovin kiiret hinnangut / nõu.",
    "",
    `Nimi: ${state.name || "-"}`,
    `E-post: ${state.email || "-"}`,
    `Telefon: ${state.phone || "-"}`,
    `Asukoht: ${state.location || "-"}`,
    `Soov: ${state.intent}`,
    `Ajaraam: ${state.timeline} kuud`,
    `Kuu tarbimine: ${state.monthlyKwh || "-"} kWh`,
    `Katus/paigaldus: ${state.roof}`,
    "",
    "Lisainfo:",
    state.notes?.trim() ? state.notes.trim() : "-",
    "",
    "—",
    "Saadetud Energiakalkulaatori kvalifitseerimislehest",
  ];
  const body = lines.join("\n");
  return `mailto:kennethalto95@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function recommendation(state: FormState) {
  const monthly = safeNumber(state.monthlyKwh);
  const isSolar = state.intent === "paikesejaam" || state.intent === "akupank";
  const roofOk = state.roof !== "ei-tea";

  if (!isSolar) {
    return {
      badge: "Järgmine samm",
      title: "Saame alustada lühikõnest",
      detail:
        "Kui eesmärk pole (ainult) päikesejaam, siis kõige kiirem on 5–10 min kõne. Kirjelda eesmärki ja olemasolevat olukorda, paneme paika järgmised sammud.",
    };
  }

  if (monthly !== null && monthly < 150) {
    return {
      badge: "Info",
      title: "Väiksem tarbimine – tasuvus vajab täpsust",
      detail:
        "Kui tarbimine on pigem madal, sõltub tasuvus palju päevaprofiilist, tarbimise ajastusest ja hinnast. Saame selle kiiresti üle vaadata.",
    };
  }

  if (!roofOk) {
    return {
      badge: "Soovitus",
      title: "Lisa katuse/paigalduse info",
      detail:
        "Kiire hinnangu jaoks on kasulik teada katuse tüüpi (või maa-paigaldus). Kui sa ei tea, kirjuta märkustesse pilt/short description ning asukoht.",
    };
  }

  return {
    badge: "Sobib hästi",
    title: "Tundub kvalifitseeruv – teeme kiire analüüsi",
    detail:
      "Kui saadad sisendid, saan anda esialgse hinnangu (suurusjärk, tasuvus, järgmised sammud) ja vajadusel suunan sobiva kalkulaatori juurde.",
  };
}

export function QualifyForm() {
  const [state, setState] = useState<FormState>(DEFAULTS);
  const [submitted, setSubmitted] = useState(false);

  const rec = useMemo(() => recommendation(state), [state]);
  const mailto = useMemo(() => buildMailto(state), [state]);

  return (
    <div className="grid gap-6">
      <section className="glass-panel rounded-3xl p-7 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">Kvalifitseeru</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Täida 1–2 minutiga. Saad kohe esmase soovituse ning saadame info e-postiga edasi.
            </p>
          </div>
          <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
            Tasuta
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-7 sm:p-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nimi">
            <input
              value={state.name}
              onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
              className="input"
              placeholder="Ees- ja perekonnanimi"
              autoComplete="name"
            />
          </Field>
          <Field label="E-post" required>
            <input
              value={state.email}
              onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
              className="input"
              placeholder="nimi@domain.ee"
              autoComplete="email"
              inputMode="email"
              required
            />
          </Field>
          <Field label="Telefon (valikuline)">
            <input
              value={state.phone}
              onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
              className="input"
              placeholder="+372 ..."
              autoComplete="tel"
              inputMode="tel"
            />
          </Field>
          <Field label="Asukoht (vald/linn)">
            <input
              value={state.location}
              onChange={(e) => setState((s) => ({ ...s, location: e.target.value }))}
              className="input"
              placeholder="nt Tartu, Viimsi, Pärnu..."
              autoComplete="address-level2"
            />
          </Field>

          <Field label="Soov">
            <select
              value={state.intent}
              onChange={(e) => setState((s) => ({ ...s, intent: e.target.value as Intent }))}
              className="input"
            >
              <option value="paikesejaam">Päikesejaam</option>
              <option value="akupank">Päikesejaam + akupank</option>
              <option value="soojuspump">Soojuspump / küte</option>
              <option value="muu">Muu</option>
            </select>
          </Field>

          <Field label="Ajaraam">
            <select
              value={state.timeline}
              onChange={(e) => setState((s) => ({ ...s, timeline: e.target.value as Timeline }))}
              className="input"
            >
              <option value="0-1">0–1</option>
              <option value="1-3">1–3</option>
              <option value="3-6">3–6</option>
              <option value="6+">6+</option>
            </select>
          </Field>

          <Field label="Tarbimine (kWh/kuu)">
            <input
              value={state.monthlyKwh}
              onChange={(e) => setState((s) => ({ ...s, monthlyKwh: e.target.value }))}
              className="input"
              placeholder="nt 350"
              inputMode="decimal"
            />
          </Field>

          <Field label="Katus / paigaldus">
            <select
              value={state.roof}
              onChange={(e) => setState((s) => ({ ...s, roof: e.target.value as FormState["roof"] }))}
              className="input"
            >
              <option value="ei-tea">Ei tea / vajab täpsust</option>
              <option value="kivi">Kivikatus</option>
              <option value="plekk">Plekk-katus</option>
              <option value="eterniit">Eterniit</option>
              <option value="lame">Lamekatus</option>
              <option value="maa">Maa-paigaldus</option>
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Lisainfo (valikuline)">
            <textarea
              value={state.notes}
              onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
              className="input min-h-[110px] resize-y"
              placeholder="nt elektriarve link, peakaitsme suurus, olemasolev PV/aku, pilt katusest jne"
            />
          </Field>

          <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={state.consent}
              onChange={(e) => setState((s) => ({ ...s, consent: e.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-emerald-400"
            />
            <span>
              Olen nõus, et minu sisestatud infot kasutatakse minuga ühenduse võtmiseks ja esialgse hinnangu andmiseks.
            </span>
          </label>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              className={`btn-glow inline-flex items-center justify-center px-4 py-2 ${
                !state.consent || !state.email ? "pointer-events-none opacity-50" : ""
              }`}
              href={mailto}
              onClick={() => setSubmitted(true)}
              aria-disabled={!state.consent || !state.email}
            >
              Saada e-postiga
            </a>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setState(DEFAULTS);
                setSubmitted(false);
              }}
            >
              Tühjenda
            </button>

            {submitted ? (
              <div className="text-xs text-zinc-400">
                Kui e-posti klient ei avanenud, kopeeri andmed käsitsi või kirjuta:{" "}
                <span className="text-emerald-200">kennethalto95@gmail.com</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-7 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-emerald-200">{rec.badge}</div>
            <h2 className="mt-1 text-lg font-semibold text-zinc-50">{rec.title}</h2>
            <p className="mt-2 text-sm text-zinc-300">{rec.detail}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-950/40 p-4 text-xs text-zinc-400">
            <div className="font-semibold text-zinc-50">Mida veel lisada?</div>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>viimane elektriarve (kWh + hind)</li>
              <li>peakaitse (A)</li>
              <li>katusesuund ja kalle (kui tead)</li>
              <li>kas on börsipakett</li>
            </ul>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.02);
          padding: 0.75rem 0.9rem;
          color: rgb(244 244 245);
          outline: none;
        }
        .input:focus {
          border-color: rgba(110, 231, 183, 0.45);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
        }
        .input::placeholder {
          color: rgba(161, 161, 170, 0.75);
        }
        select.input {
          padding-right: 2.2rem;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="font-semibold text-zinc-200">{label}</span>
        {required ? <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-0.5">kohustuslik</span> : null}
      </div>
      {children}
    </label>
  );
}

