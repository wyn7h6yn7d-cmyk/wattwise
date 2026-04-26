"use client";

import { FormEvent, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PanelDirection } from "@/lib/forecast/energy-forecast";

type ForecastFiltersProps = {
  location: string;
  latitude: string;
  longitude: string;
  hours: 24 | 48;
  historyYears: 5 | 10;
  input: {
    systemKw: number;
    panelDirection: PanelDirection;
    panelTiltDeg: number;
    systemLossesPercent: number;
    hasEv: boolean;
    hasBattery: boolean;
  };
  geo: {
    name: string;
    usedDefaultLocation: boolean;
  };
};

export function ForecastFilters({ location, latitude, longitude, hours, historyYears, input, geo }: ForecastFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const params = new URLSearchParams();

    const setIfPresent = (key: string, value: FormDataEntryValue | null) => {
      const str = typeof value === "string" ? value.trim() : "";
      if (str.length > 0) params.set(key, str);
    };

    setIfPresent("location", formData.get("location"));
    setIfPresent("latitude", formData.get("latitude"));
    setIfPresent("longitude", formData.get("longitude"));
    setIfPresent("systemKw", formData.get("systemKw"));
    setIfPresent("panelDirection", formData.get("panelDirection"));
    setIfPresent("panelTiltDeg", formData.get("panelTiltDeg"));
    setIfPresent("systemLossesPercent", formData.get("systemLossesPercent"));
    setIfPresent("hours", formData.get("hours"));
    setIfPresent("historyYears", formData.get("historyYears"));

    if (formData.get("hasEv")) params.set("hasEv", "on");
    if (formData.get("hasBattery")) params.set("hasBattery", "on");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <form className="mt-4 grid gap-4 lg:grid-cols-3" onSubmit={onSubmit}>
      <label className="field-label">
        <span className="field-label-text">Asukoht</span>
        <input name="location" defaultValue={location} className="input" placeholder="Tallinn, Tartu..." />
        <span className="field-hint">Voi kasuta koordinaate allpool.</span>
      </label>
      <label className="field-label">
        <span className="field-label-text">Latitude</span>
        <input name="latitude" defaultValue={latitude} className="input" placeholder="59.437" />
        <span className="field-hint">Valikuline.</span>
      </label>
      <label className="field-label">
        <span className="field-label-text">Longitude</span>
        <input name="longitude" defaultValue={longitude} className="input" placeholder="24.7536" />
        <span className="field-hint">Valikuline.</span>
      </label>
      <label className="field-label">
        <span className="field-label-text">Paikesejaama voimsus (kW)</span>
        <input
          name="systemKw"
          defaultValue={input.systemKw > 0 ? String(input.systemKw) : ""}
          className="input"
          placeholder="nt 12"
        />
        <span className="field-hint">Inverteri voi susteemi nimivoimsus.</span>
      </label>
      <label className="field-label">
        <span className="field-label-text">Paneelide suund</span>
        <select name="panelDirection" defaultValue={input.panelDirection} className="input">
          <option value="louna">Louna</option>
          <option value="ida-laas">Ida-laas</option>
          <option value="ida">Ida</option>
          <option value="laas">Laas</option>
          <option value="muu">Muu</option>
        </select>
        <span className="field-hint">Mojutab tootluse koefitsienti.</span>
      </label>
      <label className="field-label">
        <span className="field-label-text">Paneelide kalle (kraadid)</span>
        <input
          name="panelTiltDeg"
          defaultValue={input.panelTiltDeg > 0 ? String(input.panelTiltDeg) : ""}
          className="input"
          placeholder="nt 35"
        />
        <span className="field-hint">Eestis tootab sageli 30-40 kraadi.</span>
      </label>
      <label className="field-label">
        <span className="field-label-text">Susteemikaod (%)</span>
        <input
          name="systemLossesPercent"
          defaultValue={input.systemLossesPercent > 0 ? String(input.systemLossesPercent) : ""}
          className="input"
          placeholder="nt 14"
        />
        <span className="field-hint">Sisaldab inverteri, juhtmete ja muu susteemi kaod.</span>
      </label>
      <label className="field-label">
        <span className="field-label-text">Prognoosi ulatus</span>
        <select name="hours" defaultValue={String(hours)} className="input">
          <option value="24">24h</option>
          <option value="48">48h</option>
        </select>
      </label>
      <label className="field-label">
        <span className="field-label-text">Ajalooline analuus</span>
        <select name="historyYears" defaultValue={String(historyYears)} className="input">
          <option value="5">Viimased 5 aastat</option>
          <option value="10">Viimased 10 aastat</option>
        </select>
        <span className="field-hint">Serveri cache kasutatakse raskete paringute vahendamiseks.</span>
      </label>
      <div className="grid gap-2 sm:grid-cols-2 lg:col-span-1">
        <label className="field-label rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
          <span className="field-label-text">Kas kasutajal on EV</span>
          <div className="yes-no-row">
            <span className="yes-no-text">Ei</span>
            <input type="checkbox" name="hasEv" defaultChecked={input.hasEv} className="yes-no-input" />
            <span className="yes-no-switch">
              <span className="yes-no-knob" />
            </span>
            <span className="yes-no-text">Jah</span>
          </div>
          <span className="field-hint">Mojutab laadimisakna soovitusi.</span>
        </label>
        <label className="field-label rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
          <span className="field-label-text">Kas kasutajal on aku</span>
          <div className="yes-no-row">
            <span className="yes-no-text">Ei</span>
            <input type="checkbox" name="hasBattery" defaultChecked={input.hasBattery} className="yes-no-input" />
            <span className="yes-no-switch">
              <span className="yes-no-knob" />
            </span>
            <span className="yes-no-text">Jah</span>
          </div>
          <span className="field-hint">Mojutab aku kasutuse soovitusi.</span>
        </label>
      </div>

      <div className="lg:col-span-3 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn-glow" disabled={isPending}>
          {isPending ? "Laen prognoosi..." : "Uuenda prognoos"}
        </button>
        {isPending ? <p className="text-xs text-zinc-400">Andmed uuenevad, palun oota...</p> : null}
        <p className="text-xs text-zinc-400">
          Kasutatud asukoht: <span className="text-zinc-200">{geo.name}</span>
          {geo.usedDefaultLocation ? " (vaikimisi Tallinn)" : ""}
        </p>
      </div>
    </form>
  );
}
