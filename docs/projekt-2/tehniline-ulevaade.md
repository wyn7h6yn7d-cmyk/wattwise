# Tööstusmoodul v1.0 — tehniline ülevaade

Dokument kirjeldab valmis koodi seisuga Projekt 2 / v1.0. Arvutusloogikat ega UI-d siin ei muudeta — ainult kaardistus.

---

## 1. Valminud moodulid

| Moodul | Roll |
|--------|------|
| Aastane PV + aku mudel | Omatarve, müük, tipp, CAPEX, tasuvus |
| Stsenaariumite võrdlus | Baas / ainult PV / PV+aku omatarve / PV+aku tipp |
| CSV tarbimise parser + kokkuvõte | Import, skaleerimine, päev/öö, tipp |
| Profiili insight + graafik | Tekstilised järeldused, koormus ajas |
| Ajapõhine simulatsioon | Samm-sammult PV/aku CSV peal |
| Ajapõhine majandus | Perioodi ja aastaks skaleeritud mõju |
| Hinnaseeria + matching | CSV hinnad → tarbimisread |
| Elering EE hinnarežiim | NPS EE laadimine + fallback |
| Demoandmed | `demo-tarbimine.csv`, `demo-hinnad.csv` |
| Raportivaade | Screenshotiks sobiv veebiraport |
| Leht `/kalkulaatorid/toostus` | Töövoog ja kogu UI |

---

## 2. Arvutusloogika failid

| Fail | Sisaldus |
|------|----------|
| `src/lib/calculators/industrial.ts` | `calculateIndustrial`, eeldused, investeering ühikhindadest, sample profiilid |
| `src/lib/calculators/industrial-scenarios.ts` | `calculateIndustrialScenarios`, neli stsenaariumi + järeldus |
| `src/lib/calculators/industrial-timeseries.ts` | `simulateIndustrialTimeseries`, PV kõver, aku dispetšer, majandus |
| `src/lib/consumption/parse-consumption-csv.ts` | Tarbimise CSV parser |
| `src/lib/consumption/consumption-profile.ts` | `summarizeConsumptionProfile`, vormiväljade tuletus |
| `src/lib/consumption/consumption-profile-insight.ts` | Insight + graafiku seeria |
| `src/lib/market/parse-price-csv.ts` | Hinnaseeria CSV parser |
| `src/lib/market/match-price-series.ts` | `matchPriceSeriesToConsumption` |
| `src/lib/market/elering-to-price-rows.ts` | Eleringi punktid → hinnaread *(kasutus UI-st)* |
| `src/lib/industrial/demo-data.ts` | Demo CSV generaatorid |

---

## 3. UI failid

| Fail | Sisaldus |
|------|----------|
| `src/app/kalkulaatorid/toostus/page.tsx` | Marsruut, metadata |
| `src/components/industrial-pv-battery-page.tsx` | Peamine leht: sisendid, CSV, hinnad, arvuta, tulemused, raport |
| `src/components/industrial/industrial-scenario-comparison.tsx` | Stsenaariumite tabel / kokkuvõte |
| `src/components/industrial/industrial-timeseries-panel.tsx` | Ajapõhine sim + majandusvaade + graafikud |
| `src/components/industrial/consumption-profile-chart.tsx` | Tarbimisprofiili graafik *(kui olemas lehel)* |
| `src/components/used-assumptions-block.tsx` | „Kasutatud eeldused“ plokk |

---

## 4. CSV tarbimisprofiil — kuidas töötab

1. Kasutaja valib režiimi **CSV import**.
2. Fail loetakse brauseris; `parseConsumptionCsv` valideerib päise ja read.
3. Edukal parsimisel: `summarizeConsumptionProfile` → kokkuvõte; `inferConsumptionProfileInsight` → järeldus; graafik.
4. Vormiväljad (aastane MWh, päevane %, tipp kW) täidetakse kokkuvõttest.
5. Demo faili `demo-tarbimine.csv` korral täidetakse tühjad PV/aku väljad soovituslike väärtustega (v1.0 QA).
6. **Arvuta** käivitab aastase mudeli; kui CSV ridu on, ka ajapõhise simulatsiooni.

Käsitsi režiim: CSV tühjendatakse; hinnapaneeli ja ajapõhist sim’i ei kuvata (või asendatakse selgitava tühioleku tekstiga).

---

## 5. Hinnaseeria — kuidas töötab

Eeldus: CSV tarbimine on laetud (`inputMode === "csv"`).

1. Kasutaja valib hinnarežiimi: keskmine / hinnaseeria CSV / Elering EE.
2. **CSV:** `parsePriceCsv` → read; `matchPriceSeriesToConsumption` seob iga tarbimisrea hinnaga (täpne → sama tund → lähim ≤ 2 h → flat fallback).
3. **Elering:** fetch `/api/elering/nps` perioodi jaoks; punktid teisendatakse hinnaridadeks; müük = vormi müügihind. Ebaõnnestumisel teade ja keskmine hind.
4. Seotud punktid antakse `simulateIndustrialTimeseries({ priceSeries })` majandusvaatesse. Aku käitumist hinnad ei muuda.

---

## 6. Stsenaariumite võrdlus — kuidas töötab

1. Pärast arvutust (ja kohustuslike sisendite olemasolul) kutsub UI `calculateIndustrialScenarios(input)`.
2. Iga stsenaarium kutsub `calculateIndustrial` erineva konfiguratsiooniga (baas nullib PV/aku mõju; peak vs omatarve).
3. Investeering: baas 0; ainult PV = kW × €/kW; PV+aku = PV + kWh × €/kWh.
4. UI kuvab tabeli, ribadiagrammi-laadse võrdluse ja automaatse lühijärelduse.

---

## 7. Ajapõhine simulatsioon — kuidas töötab

1. Vajab `csvRows` + kokkuvõtet + arvutatud sisendeid.
2. `simulateIndustrialTimeseries`:
   - määrab sammu kestuse (intervall);
   - arvutab PV päevakuju × kuuteguri, normaliseerib perioodi summa;
   - jooksutab aku SOC-i reeglitega;
   - salvestab võrgu ost/müük, SOC, netovõimsus;
   - `computeTimeseriesEconomics` arvutab perioodi eurod ja aastaks skaleerimise.
3. Paneel näitab numbreid, majandusplokki, tarbimine vs PV ja SOC graafikuid (downsample ~96 punkti).

---

## 8. Testid → osad

| Testifail | Katab |
|-----------|--------|
| `industrial.test.ts` | Aastane mudel, tipp, eksport, võimsustasu, sample profiilid |
| `industrial-scenarios.test.ts` | Stsenaariumid, investeeringud, tasuvus, järeldused |
| `industrial-timeseries.test.ts` | PV öö/päev, SOC, võimsuspiirid, balanss, tipu lõige |
| `industrial-timeseries-economics.test.ts` | Majandus, skaleerimine, flat hinnad sammudes |
| `consumption-profile.test.ts` | Parser + kokkuvõte, intervallid, vead |
| `consumption-profile-insight.test.ts` | Kujud, tipukas, graafiku agregeerimine |
| `price-series.test.ts` | Hinnaparser, matching, flat vs seeria mõju |
| `demo-data.test.ts` | Demo CSV-de kooskõla (7×24) |
| `demo-journey.qa.test.ts` | Täisteekond, käsitsi calc, veateated, puudulik kate |

v1.0 QA: **65 / 65** läbis; `next build` OK.

---

## 9. Teadaolevad piirangud

- Lihtsustatud PV kõver; ahnus-aku (mitte spot-optimeerija).
- Lühike CSV → aastane skaleerimine.
- Hinnaseeria ≠ aku optimeerimine.
- Elering: müük vormist; API võib failida → flat.
- Naive ajatemplid (ajavööndi teadlik käsitlus puudub parseris).
- PDF puudub.
- Aastane mudel ja timeseries-majandus võivad anda erineva skaleeritud €/a.
- Stsenaariumite tabel võib mobiilis sisemiselt horisontaalselt kerida.

*Vajab käsitsi täpsustamist:* Eleringi API käitumine konkreetse demo perioodi peal live-võrgus (sõltub API saadavusest kaitsmise hetkel).
