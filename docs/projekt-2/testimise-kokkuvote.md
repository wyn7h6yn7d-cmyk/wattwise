# Testimise kokkuvõte — tööstusmoodul v1.0

Seis põhineb Projekt 2 v1.0 QA-l (vitest + `next build` + käsitsi / brauseri teekond).  
Selles dokumendi loomise käigus teste ega buildi uuesti ei käivitatud.

---

## 1. Testifailid

| Fail | Asukoht |
|------|---------|
| `industrial.test.ts` | `src/lib/calculators/` |
| `industrial-scenarios.test.ts` | `src/lib/calculators/` |
| `industrial-timeseries.test.ts` | `src/lib/calculators/` |
| `industrial-timeseries-economics.test.ts` | `src/lib/calculators/` |
| `consumption-profile.test.ts` | `src/lib/consumption/` |
| `consumption-profile-insight.test.ts` | `src/lib/consumption/` |
| `price-series.test.ts` | `src/lib/market/` |
| `demo-data.test.ts` | `src/lib/industrial/` |
| `demo-journey.qa.test.ts` | `src/lib/industrial/` |

**Kokku (v1.0 QA käivitus):** 9 faili, **65 / 65** testi läbis.

---

## 2. Mida iga testifail kontrollib

### `industrial.test.ts`
- PV toodang = võimsus × tootlikkus  
- Päevane osakaal tõstab omatarvet  
- Aku omatarve ei ületa eksporditavat PV-d  
- Peak shaving lõikab tippu, aga mitte alla eelduslikku põrandat  
- Omatarbe režiimis tippu ei lõigata  
- Sisendite sanitiseerimine  
- Ühikhinna investeering ja tasuvus  
- Eksporttulu ja võimsustasu (ainult tipurežiimis)  
- Sample profiilide lõplikud tulemused  

### `industrial-scenarios.test.ts`
- Baas: null mõju / null investeering  
- Ainult PV vs PV+aku investeering  
- Eksport ja demand charge stsenaariumites  
- Tasuvus stsenaariumi investeeringu põhjal  
- „Parima“ stsenaariumi tuvastus  
- Energiavood ühtivad `calculateIndustrial`-iga PV-only korral  

### `industrial-timeseries.test.ts`
- PV öösel ~0, päeval > 0  
- SOC piirides, võimsuspiirid  
- Omatarve aku suurendab kohapealset kasutust  
- Peak shaving vähendab tippvõrguvõimsust  
- AC energia balanss sammu kohta  

### `industrial-timeseries-economics.test.ts`
- Võrguost väheneb PV-ga  
- Omatarve hinnatud ostuhinnaga, müük müügihinnaga  
- Demand charge tipurežiimis  
- Aastaks skaleerimine covered hours järgi  
- Nullhinnad → null eurot; flat hinnad sammudes  

### `consumption-profile.test.ts`
- Koma- ja semikoolon-CSV  
- Vigased / puuduvad veerud, tühi fail, negatiivne tarbimine  
- Summad, tipp, päevane osakaal 08–20  
- 1 h / 15 min / ebaregulaarne intervall  

### `consumption-profile-insight.test.ts`
- Päevane / ühtlane / tipukas kuju  
- Aku soovitus (omatarve vs peak)  
- Graafiku agregeerimine suure seeria korral  

### `price-series.test.ts`
- Hinnaseeria parse (koma/semikoolon)  
- Puuduv veerg → viga  
- Timestamp matching + hoiatus puuduliku katte korral  
- Flat vs seeria mõju majandusele  

### `demo-data.test.ts`
- Demo tarbimine ja hinnad: 7×24, kattuvad ajatemplid  

### `demo-journey.qa.test.ts`
- Täisteekond demo CSV → matching (0 unmatched) → calc + scenarios + timeseries  
- Käsitsi calc ilma timeseries’ta  
- Selged vead puuduva timestamp / consumption / ostuhinna veeru korral  
- Hoiatus, kui hinnaseeria ei kata kogu perioodi  

---

## 3. Lõplik automaattestide seis (v1.0 QA)

| Kontroll | Tulemus |
|----------|---------|
| Vitest (ülaltoodud 9 faili) | **65 / 65 passed** |
| `next build` | **õnnestus** |

*Vajab käsitsi täpsustamist:* kui peale dokumendi loomist tehakse uusi commit’e, tuleks testid uuesti käivitada ja see tabel uuendada.

---

## 4. Käsitsi QA sammud (kontrollitud v1.0 QA-s)

1. Lehe avamine puhta olekuga  
2. Töövoo arusaadavus (5 sammu + demo nupud)  
3. Demo tarbimise allalaadimine / import  
4. Kokkuvõte, graafik, järeldus  
5. Demo hinna allalaadimine / hinnaseeria valik / import  
6. Sidumine 168/168 ilma olulise hoiatuseta  
7. Arvuta → põhitulemus, stsenaariumid, timeseries, majandus, raport  
8. Raport pärast arvutust, v1.0 silt, loetavus  
9. Käsitsi režiim: CSV paneelid ei sega; tühioleku tekst simulatsiooni kohta  
10. Veateated: vigane / puuduv veerg tarbimisel ja hinnaseerial; puudulik hinnakate  
11. Eleringi ebaõnnestumise tekst / fallback (silt ja teade koodis)  
12. Disain: ei lisatud uut rohelist; leheülene overflow peidetud  

**Märkus hydrationi kohta:** brauseri automatiseerimise tööriist võib lisada `data-cursor-ref` atribuute, mis Next.js arendusoverleys näivad hydration-veana. See ei ole rakenduse enda SSR/CSR sisu erinevus. *Vajab käsitsi täpsustamist:* puhas Chrome ilma automatiseerimiseta kinnituseks, kui juhendaja nõuab.

---

## 5. Piirangud, mis jäid alles

- Lihtsustatud PV tootmisprofiil  
- Reeglipõhine (ahnus) aku — ei ole börsihinna optimeerija  
- Lühike CSV skaleeritakse aastaks  
- Hinnaseeria / Elering mõjutab raha, mitte aku dispetšerit  
- Eleringi müük = vormi müügihind; API võib ebaõnnestuda  
- Naive ajatemplid  
- PDF eksport puudub  
- Tulemused on esmane hinnang, mitte investeerimisotsus  
- Stsenaariumite lai tabel võib mobiilis sisemiselt kerida  

---

## 6. Soovitus aruande pealkirja all

> Automaattestid (65/65) ja tootmise build (`next build`) kinnitasid tööstusmooduli v1.0 arvutus- ja demo-teekonna stabiilsust. Käsitsi QA kinnitas kasutajateekonna, veateated ja raportivaate. Järelejäänud piirangud on teadlikud lihtsustused, mitte avastamata defektid.
