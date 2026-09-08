# Projekt 2 — aruande mustandi materjal  
## Energiakalkulaator.ee tööstusmoodul v1.0

*Tekst on mõeldud Wordi aruandesse tõstmiseks. Versioonikirjeldused (v0.1 … v1.0) peegeldavad arendusetappe koodis; lõppseis on tööstusmooduli v1.0.*

---

## 1. Sissejuhatus

Tööstusettevõtete elektrikulud ja võrguvõimsuse nõuded on seotud tarbimisprofiili kujuga, päikeseenergia tootmise ajastusega ning akusalvestuse rolliga. Omatarve, tipukoormus ja võrku müük ei ole ühe keskmise hinnaga lihtsalt kirjeldatavad: päevane ja öine tarbimine, tiputunnid ning hinnad mõjutavad tulemust erinevalt.

Projekt 2 raames arendati platvormile Energiakalkulaator.ee tööstusmoodul (marsruut `/kalkulaatorid/toostus`), mis annab esmase, loetava hinnangu PV + aku mõjule. Moodul ei asenda detailset tehnilist ega finantsanalüüsi. Selle eesmärk on struktureerida sisendid, näidata stsenaariume ja teha tulemused aruande- ning kaitsmiseks sobivaks.

---

## 2. Probleemipüstitus

Tööstuslikul tarbijal on tüüpiliselt:

- aastane energiakulu ja tipukoormus, mida võimsustasu võib oluliselt mõjutada;
- soov hinnata, kas PV ja aku suurendavad omatarvet või vähendavad tippu;
- vajadus võrrelda baasstsenaariumi, ainult PV ning PV + aku eri režiime;
- soov kasutada enda tarbimisandmeid (CSV), mitte ainult üldistatud keskmisi.

Olemasolevad üldkalkulaatorid keskenduvad sageli kodumajapidamisele või ühele keskmisele hinnale. Tööstusliku otsuse jaoks on vaja tarbimisprofiili, lihtsustatud majandusmudelit ja selget piirangute kirjeldust. Probleem on seega: kuidas anda veebis arusaadav, kontrollitav esmane hinnang ilma täisoptimeerija keerukuseta.

---

## 3. Projekti eesmärk ja uurimisküsimus

**Eesmärk.** Arendada Energiakalkulaator.ee tööstusmoodul, mis:

1. arvutab lihtsustatud PV + aku mõju omatarbele, võrku müügile, tipukoormusele ja aastasele majanduslikule kogumõjule;
2. võimaldab CSV tarbimisprofiili importi, kokkuvõtet, graafikut ja tekstilist järeldust;
3. võrdleb stsenaariume (baas, ainult PV, PV + aku omatarve, PV + aku peak shaving);
4. toetab ajapõhist simulatsiooni CSV peal ning hinnarežiime (keskmine hind, hinnaseeria CSV, Elering EE);
5. pakub demoandmeid ja raportivaadet kaitsmise / aruande jaoks.

**Uurimisküsimus.** Kuidas saab veebipõhise tööstusmooduli abil anda esmase, läbipaistva hinnangu PV ja aku mõjule, kui sisendiks on tarbimisprofiil ning lihtsustatud tehnilised ja majanduslikud eeldused?

---

## 4. Olemasoleva olukorra uurimine

Platvormil olid enne Projekt 2 fookust mitmed kalkulaatorid (sh PV, peak shaving, börsihind). Tööstusliku PV + aku terviklikku teekonda — CSV profiil, stsenaariumid, ajapõhine sim ja raport — ei olnud ühtse moodulina.

Võrdlusena (üldisel tasemel, ilma väliste allikate detailanalüüsi):

- keskmistel „säästu kalkulaatoritel“ puudub sageli tipukoormuse ja võimsustasu loogika;
- professionaalsed energiaanalüüsi tööriistad on võimsamad, kuid eeldavad spetsialisti ja ei sobi kergeks veebidemoks.

*Vajab käsitsi täpsustamist:* aruandes võib lisada juhendaja soovitud võrdlusobjektid või kursuse kirjanduse viited; käesolev mustand ei lisa väliseid allikaid.

---

## 5. Lahenduse valik

Valiti **inkrementaalne veebimoodul** Next.js rakenduses, mitte eraldiseisev optimeerimismootor.

Põhjused:

- sama platvorm ja kasutajakogemus nagu teistel kalkulaatoritel;
- arvutusloogika eraldatud UI-st (`src/lib/calculators/…`), mistõttu on testitav;
- etapiline arendus (v0.1 → v1.0) võimaldas iga kihi eraldi kontrollida;
- teadlik lihtsustamine (päevakõver, ahnus-aku, aastaks skaleerimine) sobib esmaseks hinnanguks.

Teadlikult **ei** valitud: täielikku börsihinna aku optimeerijat, PDF-eksporti ega mitmeaastast finantsmudelit. Need jäävad edasiarenduseks.

---

## 6. Lahenduse projekteerimine

Lahendus jaguneb kihtideks:

| Kiht | Sisaldus |
|------|----------|
| Sisend | Käsitsi vorm või CSV tarbimine; majanduslikud eeldused; hinnarežiim |
| Aastane mudel | `calculateIndustrial` — omatarve, müük, tipp, ühikhinna CAPEX, tasuvus |
| Stsenaariumid | `calculateIndustrialScenarios` — neli stsenaariumi sama mudeli peal |
| Profiil | Parser, kokkuvõte, insight, graafik |
| Ajapõhine | `simulateIndustrialTimeseries` — samm-sammult PV/aku + majandus |
| Turuhinnad | Hinnaseeria CSV või Elering EE, sidumine ajatempliga |
| Esitus | Leht `/kalkulaatorid/toostus`, paneelid, raportivaade |

Kasutajateekond: töövoo juhis → andmed (käsitsi / CSV) → eeldused → hinnarežiim (CSV korral) → arvuta → tulemused / stsenaariumid / simulatsioon / raport.

---

## 7. Lahenduse teostus

### 7.1 Platvormi fookuse korrastamine

Tööstusmoodul paigutati marsruudile `/kalkulaatorid/toostus` koos pealkirja ja metaandmetega. Leht kasutab olemasolevat kalkulaatori kesta (`CalculatorRouteShell`) ja keskendub ühele ülesandele: tööstuslik PV + aku hinnang.

### 7.2 Tööstusmooduli v0.1 põhimudel

Fail: `src/lib/calculators/industrial.ts`.

Sisendid: aastane tarbimine, päevane osakaal, tipukoormus, PV võimsus ja tootlikkus, aku maht/võimsus, aku eesmärk (omatarve või peak shaving), elektri ostuhind.

Loogika (lihtsustatud):

- PV toodang = võimsus × spetsiifiline tootlikkus;
- omatarve sõltub päevasest osakaalust ja kattuvuse eeldusest;
- aku suurendab omatarvet (omatarbe režiim) või vähendab tippu (peak shaving), vastavalt eeldustele;
- tippu ei lõigata omatarbe režiimis.

Tulemuseks on energiavood, tipu enne/pärast ja tekstiline kokkuvõte.

### 7.3 CSV tarbimisprofiili import

Failid: `parse-consumption-csv.ts`, `consumption-profile.ts`.

- Veerud: ajatemplid (`timestamp` / `aeg` / `date` / `datetime`) ja tarbimine (`consumption_kwh` jt lubatud nimed).
- Eraldaja: koma, semikoolon või tabulatsioon.
- Negatiivne tarbimine lükatakse tagasi selge veateatega.
- Kokkuvõte: ridu, periood, tipp, keskmine, päev/öö osakaal (08:00–20:00), intervall (1 h / 15 min / ebaregulaarne).
- Kui periood ei kata peaaegu aastat, skaleeritakse tarbimine 8760 tunni peale.

Vormiväljad täidetakse kokkuvõttest; kasutaja saab neid käsitsi muuta.

### 7.4 Tarbimisprofiili graafik ja raportivaade

Failid: `consumption-profile-insight.ts`, graafiku komponent, lehe raportiplokk.

- Insight klassifitseerib profiili (päevane / ühtlane / tipukas) ja soovitab aku rolli.
- Graafik kuvab koormust ajas; suure seeria korral agregeeritakse (kuni ~96 punkti).
- Raportivaade (`#industrial-report`) koondab sisendid, profiili, hinnarežiimi, tulemused, stsenaariumid, simulatsiooni, järelduse ja piirangud. Ilmub pärast arvutust (v1.0 QA). PDF eksporti ei ole.

### 7.5 Stsenaariumite võrdlus

Fail: `industrial-scenarios.ts`.

Neli stsenaariumi:

1. baas (ilma PV/akuta mõjuta);
2. ainult PV;
3. PV + aku omatarbeks;
4. PV + aku peak shavinguks.

Iga stsenaarium kasutab sama `calculateIndustrial` mudelit erineva konfiguratsiooniga. Investeeringud arvutatakse ühikhindadest (€/kW, €/kWh). Automaatne lühijäreldus toob välja suurima kogumõju, lühima tasuvuse ja tipu vähendamise.

### 7.6 Majandusmudeli täiendamine

v0.5 tasemel täiendati mudelit:

- PV CAPEX €/kW, aku CAPEX €/kWh;
- võrku müügihind €/MWh;
- võimsustasu €/kW/kuu (peak shaving);
- aku kasutegur ja kasutatav maht (DoD).

Aastane kogumõju = omatarbe sääst + müügitulu + (vajadusel) võimsustasu sääst. Tasuvus = investeering / aastane kogumõju (kui mõlemad positiivsed).

### 7.7 Ajapõhine PV ja aku simulatsioon

Fail: `industrial-timeseries.ts`.

Eeldab CSV ridu. Iga sammu kohta:

- tarbimine CSV-st;
- PV lihtsustatud päevakõvera ja kuuteguri järgi (perioodi summa seotud aastatoodanguga);
- aku ahnusloogika: omatarbe režiimis laeb ülejäägist / tühjeneb puudujääki; peak shavingus sihttase tipu lähedal;
- võrgu ost/müük jäägina.

Majandusvaade: perioodi kogumõju ja aastaks skaleeritud hinnang. Aku dispetšerit börsihinna järgi ei optimeerita.

### 7.8 Hinnaseeria ja Elering EE hinnarežiim

Failid: `parse-price-csv.ts`, `match-price-series.ts`, Eleringi API kaudu UI.

Hinnarežiimid CSV teekonnas:

1. **Keskmine hind** — vormi ostu- ja müügihind;
2. **Hinnaseeria CSV** — `timestamp`, `buy_price_eur_mwh`, `export_price_eur_mwh`;
3. **Elering EE** — NPS EE perioodi jaoks; müügihinnaks kasutatakse vormi müügihinda. Ebaõnnestumisel fallback keskmisele hinnale.

Sidumine tarbimisridadega: täpne ajatempli → sama tund → lähim (vaikimisi kuni 2 h) → keskmine varu. Hoiatus, kui periood ei kata.

### 7.9 Demoandmed ja v1.0 kvaliteedikontroll

Fail: `src/lib/industrial/demo-data.ts`.

- `demo-tarbimine.csv`: 7 × 24 h (2026-03-01 … 03-07);
- `demo-hinnad.csv`: sama perioodi ostu/müügi hinnad.

v1.0 QA: töövoo copy, demo PV/aku eeltäide, raport pärast arvutust, käsitsi režiimi eraldamine CSV paneelidest, selged veateated, vitest + `next build`. Suuri uusi funktsioone v1.0-sse ei lisatud.

---

## 8. Testimine

Automaattestid (Vitest) katavad arvutusmooduleid, CSV/hinnaparserit, demot ja demo teekonda. v1.0 QA seis: **65 / 65** testi läbis; **`next build` õnnestus**.

Käsitsi: puhas leht, demo CSV teekond, käsitsi režiim, vigased CSV-d, Eleringi fallback-tekst, raporti loetavus, mobiilil horisontaalse lehekerimise vältimine (tabel võib sisemiselt kerida).

Detailid: `docs/projekt-2/testimise-kokkuvote.md`.

---

## 9. Tulemuste analüüs

Demoandmetega (näide kaitsmise teekonnast):

- tarbimisprofiil: ~168 rida, ~1 h intervall, hinnanguline aastane tarbimine ~491 MWh, päevane osakaal ~65 %;
- hinnaseeria: 168 / 168 sidumist ilma olulise hoiatuseta;
- pärast arvutust: põhitulemus, neli stsenaariumi, ajapõhine sim + majandus, raportivaade.

Tulemused sõltuvad eeldustest (CAPEX, hinnad, aku režiim). Aastane mudel ja ajapõhine majandus võivad anda erineva skaleeritud numbri, sest esimene on profiili kokkuvõtte põhjal, teine perioodi sammude põhjal. See on ootuspärane lihtsustuste juures ja tuleb aruandes piiranguna välja öelda.

*Vajab käsitsi täpsustamist:* kui aruandes esitatakse konkreetsed numbrid tabelina, tuleks need pärast lõplikku demo käiku uuesti salvestada.

---

## 10. Piirangud ja edasiarendus

**Piirangud (v1.0):**

- PV tootmisprofiil on lihtsustatud (päevakõver + kuutegur), mitte mõõdetud ega PVGIS-detail;
- aku on reeglipõhine, mitte börsihinna optimeerija;
- lühike CSV skaleeritakse aastaks;
- hinnaseeria mõjutab rahalist arvestust, mitte aku dispetšerit;
- Eleringi müük = vormi müügihind; API võib ebaõnnestuda;
- ajatemplid käsitletakse „naiivselt“ (ilma ajavööndi teadliku teisenduseta parseris);
- PDF eksporti ei ole;
- tulemused on esmane hinnang, mitte investeerimisotsus.

**Edasiarendus (näited):**

- börsihinna põhine aku dispetšer;
- parem PV tootmisprofiil (nt mõõdetud või välist API);
- PDF / eksport;
- pikemate andmestike ja ajavööndi käsitlus;
- tundlikkusanalüüs CAPEX / hinna suhtes.

---

## 11. Kokkuvõte

Projekt 2 teostas Energiakalkulaator.ee tööstusmooduli v1.0: käsitsi ja CSV sisend, majanduslikud eeldused, stsenaariumite võrdlus, ajapõhine simulatsioon hinnarežiimidega, demoandmed ja raportivaade. Lahendus vastab eesmärgile anda läbipaistev esmane hinnang. Uurimisküsimusele vastus: jah, veebimooduliga on võimalik struktureerida tarbimisprofiil ja lihtsustatud eeldused nii, et tulemus on arusaadav ning piirangud on sõnastatud — tingimusel, et kasutaja ei tõlgenda tulemust lõpliku investeerimisotsusena.

---

## 12. Lisad

Soovitatavad lisad Wordi aruandes:

- **Lisa A.** Demo CSV struktuuri näidis (`timestamp,consumption_kwh` ja hinnaseeria veerud).
- **Lisa B.** Stsenaariumite tabeli ekraanikuva.
- **Lisa C.** Raportivaate ekraanikuva.
- **Lisa D.** Testimise kokkuvõte (`testimise-kokkuvote.md`).
- **Lisa E.** Tehniline ülevaade failide kaupa (`tehniline-ulevaade.md`).
- **Lisa F.** Kaitsmise demo skript (`demo-script.md`).

Screenshotide nimekiri: `docs/projekt-2/screenshot-list.md`.
