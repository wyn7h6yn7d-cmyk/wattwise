"use client";

import { fmtEt } from "@/components/industrial/format-et";
import type { MatchPriceSeriesResult } from "@/lib/market/match-price-series";

export type IndustrialPriceModeId = "flat" | "csv" | "elering";

export type IndustrialPriceBasisProps = {
  variant: "form" | "result";
  priceMode: IndustrialPriceModeId;
  hasCsvProfile: boolean;
  formBuyEurPerMwh: number | null;
  formExportEurPerMwh: number | null;
  seriesBuyMeanEurPerMwh: number | null;
  seriesPointCount: number;
  eleringReady: boolean;
  priceMatch: MatchPriceSeriesResult | null;
};

function eurMwh(value: number | null): string {
  return value != null && Number.isFinite(value) ? `${fmtEt(value, 1)} €/MWh` : "—";
}

function modeTitle(mode: IndustrialPriceModeId): string {
  if (mode === "csv") return "hinnaseeria CSV";
  if (mode === "elering") return "Elering EE NPS";
  return "keskmine hind";
}

export function IndustrialPriceBasis({
  variant,
  priceMode,
  hasCsvProfile,
  formBuyEurPerMwh,
  formExportEurPerMwh,
  seriesBuyMeanEurPerMwh,
  seriesPointCount,
  eleringReady,
  priceMatch,
}: IndustrialPriceBasisProps) {
  const usesStepPrices = hasCsvProfile && priceMode !== "flat" && seriesPointCount > 0;
  const isSpot = priceMode === "elering" && hasCsvProfile;

  return (
    <div className="border border-zinc-800 bg-zinc-950/80 px-3 py-3 text-sm leading-relaxed text-zinc-400 sm:px-4 sm:py-3.5">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-zinc-500">
        Hindade alus
      </p>
      <p className="mt-2 text-zinc-200">
        {variant === "result"
          ? "Selles arvutuses ei tule elektri ostuhind automaatselt turu keskmisest."
          : "Elektri ostuhind ei tule automaatselt turu keskmisest — allpool on, millist hinda milline arvutus kasutab."}
      </p>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-zinc-300">Aastane mudel (KPI, stsenaariumid, tasuvus)</dt>
          <dd className="mt-1 text-xs leading-relaxed">
            Ost = vormi väli „Elektri ostuhind“ ({eurMwh(formBuyEurPerMwh)}). Müük = vormi võrku müügi
            hind ({eurMwh(formExportEurPerMwh)}). See on sinu antud keskmine €/MWh, mitte Eleringist
            arvutatud perioodi keskmine. Tühi vorm kasutab näidist 110 €/MWh; näidisprofiilid 110 / 95 /
            120 €/MWh — need on eeldused, mitte börsi keskmine.
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-zinc-300">Ajapõhine majandus (CSV tarbimisprofiil)</dt>
          <dd className="mt-1 text-xs leading-relaxed">
            {!hasCsvProfile ? (
              <>Ilma tarbimise CSV-ta ajapõhist euroarvestust ei tehta. Hinnarežiim ilmub pärast CSV importi.</>
            ) : priceMode === "flat" || !usesStepPrices ? (
              <>
                Praegu: {modeTitle(priceMode)}. Iga samm kasutab sama vormi ostu- ja müügihinda
                ({eurMwh(formBuyEurPerMwh)} / {eurMwh(formExportEurPerMwh)}
                {priceMode === "elering" && !eleringReady
                  ? "; Eleringi seeria pole laetud, seega börsihindu ei kasutata"
                  : priceMode === "csv" && seriesPointCount === 0
                    ? "; hinnaseeria faili pole laetud, seega seeriahindu ei kasutata"
                    : ""}
                ).
              </>
            ) : priceMode === "csv" ? (
              <>
                Ost ja müük tulevad hinnaseeria CSV veergudest ajatempli järgi. See ei ole perioodi
                keskmine. Sidumata read kasutavad vormi keskmisi.
              </>
            ) : (
              <>
                Ost = Eesti NPS börsihind sellel ajatemplil (€/MWh, käibemaksuta). Müük jääb vormi
                võrku müügihinnaks, sest NPS toitehinda ei anna. Sidumata read: vormi keskmised.
              </>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-3 border border-zinc-800/90 bg-zinc-900/50 px-3 py-2.5">
        <p className="text-xs font-medium text-zinc-200">Kas börsihind on keskmine?</p>
        <p className="mt-1 text-xs leading-relaxed">
          {isSpot && eleringReady ? (
            <>
              Ei. Eleringi režiimis on ostuhind Eesti NPS hind konkreetsel 15 min või 1 h ajatemplil,
              mitte CSV perioodi keskmine.
              {seriesBuyMeanEurPerMwh != null && seriesPointCount > 0 ? (
                <>
                  {" "}
                  Laetud {fmtEt(seriesPointCount, 0)} NPS punkti aritmeetiline keskmine on{" "}
                  <span className="font-mono text-zinc-100">{eurMwh(seriesBuyMeanEurPerMwh)}</span> —
                  ainult võrdluseks; sammudes seda keskmist ei kasutata.
                </>
              ) : null}
            </>
          ) : isSpot && !eleringReady ? (
            <>
              Eleringi režiim on valitud, aga seeria puudub — ajapõhine majandus kasutab vormi keskmist
              ostuhinda {eurMwh(formBuyEurPerMwh)}, mitte börsihinda.
            </>
          ) : priceMode === "csv" && hasCsvProfile && seriesPointCount > 0 ? (
            <>
              Hinnaseeria CSV ei ole keskmine: iga tarbimissamm saab faili hinna (või vormi keskmise,
              kui sidumine ebaõnnestub).
              {seriesBuyMeanEurPerMwh != null && seriesPointCount > 0 ? (
                <>
                  {" "}
                  Faili ostuhindade aritmeetiline keskmine on{" "}
                  <span className="font-mono text-zinc-100">{eurMwh(seriesBuyMeanEurPerMwh)}</span>{" "}
                  (võrdluseks).
                </>
              ) : null}
            </>
          ) : priceMode === "csv" && hasCsvProfile ? (
            <>
              Hinnaseeria CSV on valitud, aga faili pole laetud. Ajapõhine majandus kasutab vormi
              keskmist ostuhinda {eurMwh(formBuyEurPerMwh)}, mitte seeria keskmist.
            </>
          ) : (
            <>
              Keskmise hinna režiimis (ja ilma CSV-ta) on ostuhind täpselt see üks vormi väärtus — jah,
              kasutaja keskmine, mitte börsist arvutatud keskmine.
            </>
          )}
        </p>
        {priceMatch && hasCsvProfile && priceMode !== "flat" ? (
          <p className="mt-2 text-xs text-zinc-500">
            Sidumine: täpne {priceMatch.exactCount}, sama tund {priceMatch.sameHourCount}, lähim ±2 h{" "}
            {priceMatch.nearestCount}, vormi keskmine {priceMatch.fallbackCount}.
          </p>
        ) : null}
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Võimsustasu tuleb vormilt ja rakendub ainult peak shaving režiimis. Hinnad mõjutavad eurodes
        tulemust, mitte aku käitumist. Tööstusmoodul ei lisa 24% käibemaksu.
      </p>
    </div>
  );
}
