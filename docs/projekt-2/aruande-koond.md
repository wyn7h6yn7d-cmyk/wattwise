# Projekt 2 — aruande koondmaterjal
## Energiakalkulaator.ee tööstusmoodul v1.0

*Tekstimaterjal Wordi aruandesse tõstmiseks. Versiooninumbrid (v0.1 … v1.0) tähistavad arendusetappe koodis; lõppseis on tööstusmooduli v1.0. Käesolev dokument koondab `docs/projekt-2/` materjalid ja koodist nähtava info; väliseid allikaid ei lisata.*

---

## 1. Sissejuhatus

Tööstusettevõtte elektrikulud sõltuvad tarbimisprofiili kujust, tipukoormusest, päikeseenergia tootmise ajastusest ning sellest, kas akusalvestust kasutatakse omatarbe suurendamiseks või tipu lõikamiseks. Üks keskmine elektri hind ei kirjelda neid seoseid piisavalt: päevane ja öine tarbimine, tiputunnid ning ostu- ja müügihinnad mõjutavad tulemust erinevalt.

Projekt 2 raames arendati platvormile Energiakalkulaator.ee tööstusmoodul (marsruut `/kalkulaatorid/toostus`). Moodul annab esmase, läbipaistva hinnangu PV + aku mõjule. See ei asenda detailset tehnilist ega finantsanalüüsi, vaid struktureerib sisendid, võrdleb stsenaariume ja teeb tulemused aruande ning kaitsmise jaoks loetavaks.

Probleem on oluline, sest tööstuslik otsus PV ja aku kohta nõuab korraga energiavoogude, tipukoormuse ja majandusliku mõju ülevaadet. Ilma selge mudeli ja piirangute kirjelduseta on raske hinnata, kas investeering üldse väärt edasist süvaanalüüsi.

---

## 2. Probleemipüstitus

Tööstuslikul tarbijal on tüüpiliselt:

- aastane energiakulu ja tipukoormus, mida võimsustasu võib oluliselt mõjutada;
- soov hinnata, kas PV ja aku suurendavad omatarvet või vähendavad tippu;
- vajadus võrrelda baasstsenaariumi, ainult PV ning PV + aku eri režiime;
- soov kasutada enda tarbimisandmeid (CSV), mitte ainult üldistatud keskmisi.

Paljud üldkalkulaatorid keskenduvad kodumajapidamisele või ühele keskmisele hinnale. Professionaalsed energiaanalüüsi tööriistad on võimsamad, kuid eeldavad spetsialisti ja ei sobi kergeks veebipõhiseks prototüübiks ega kaitsmise demoks.

Probleemipüstitus: kuidas anda veebis arusaadav ja kontrollitav esmane hinnang PV + aku mõjule ilma täisoptimeerija keerukuseta, nii et tarbimisprofiil, stsenaariumid ja piirangud oleksid kasutajale selged.

---

## 3. Projekti eesmärk ja uurimisküsimus

**Eesmärk.** Arendada Energiakalkulaator.ee tööstusmoodul, mis:

1. arvutab lihtsustatud PV + aku mõju omatarbele, võrku müügile, tipukoormusele ja aastasele majanduslikule kogumõjule;
2. võimaldab CSV tarbimisprofiili importi, kokkuvõtet, graafikut ja tekstilist järeldust;
3. võrdleb stsenaariume (baas, ainult PV, PV + aku omatarve, PV + aku peak shaving);
4. toetab ajapõhist simulatsiooni CSV peal ning hinnarežiime (keskmine hind, hinnaseeria CSV, Elering EE);
5. pakub demoandmeid ja raportivaadet kaitsmise ning aruande jaoks.

**Uurimisküsimus.** Kuidas saab veebipõhise tööstusmooduli abil anda esmase, läbipaistva hinnangu PV ja aku mõjule, kui sisendiks on tarbimisprofiil ning lihtsustatud tehnilised ja majanduslikud eeldused?

---

## 4. Olemasoleva olukorra uurimine

Enne Projekt 2 fookust olid platvormil mitmed kalkulaatorid (sh PV, peak shaving, börsihind). Tööstusliku PV + aku terviklikku teekonda — CSV tarbimisprofiil, stsenaariumite võrdlus, ajapõhine simulatsioon hinnarežiimidega ja raportivaade — ei olnud ühtse moodulina.

Üldisel tasemel:

- lihtsustatud „säästu kalkulaatoritel“ puudub sageli tipukoormuse ja võimsustasu loogika;
- spetsialistitööriistad võimaldavad detailsemat analüüsi, kuid ei sobi kergeks veebidemoks.

*Vajab käsitsi täpsustamist:* aruandes võib lisada juhendaja soovitud võrdlusobjektid või kursuse kirjanduse viited. Käesolev koondmaterjal väliseid allikaid ei lisa.

---

## 5. Lahenduse valik

Valiti **inkrementaalne veebipõhine prototüüp** olemasolevas Next.js rakenduses, mitte eraldiseisev optimeerimismootor.

Miks veebipõhine prototüüp:

- sama platvorm ja kasutajakogemus nagu teistel Energiakalkulaator.ee tööriistadel;
- arvutusloogika on eraldatud kasutajaliidesest (`src/lib/calculators/…`), mistõttu on see automaattestidega kontrollitav;
- etapiline arendus (v0.1 → v1.0) võimaldas iga kihi eraldi lisada ja kontrollida;
- teadlik lihtsustamine (päevakõver, ahnusloogikaga aku, lühikese CSV skaleerimine aastaks) sobib esmaseks hinnanguks ja kaitsmise demoks.

Teadlikult ei valitud täielikku börsihinna aku optimeerijat, PDF-eksporti ega mitmeaastast finantsmudelit. Need jäävad edasiarenduseks (sh võimalikuks magistritöö fookuseks).

---

## 6. Lahenduse projekteerimine

Lahendus on kihiline:

| Kiht | Sisaldus |
|---|---|
| Sisend | Käsitsi vorm või CSV tarbimine; majanduslikud eeldused; hinnarežiim |
| Aastane mudel | calculateIndustrial — omatarve, müük, tipp, ühikhinna CAPEX, tasuvus |
| Stsenaariumid | calculateIndustrialScenarios — neli stsenaariumi sama mudeli peal |
| Profiil | Parser, kokkuvõte, järeldus (insight), graafik |
| Ajapõhine | simulateIndustrialTimeseries — samm-sammult PV/aku + majandus |
| Hinnad | Hinnaseeria CSV või Elering EE, sidumine ajatempliga |
| Esitus | Leht /kalkulaatorid/toostus, paneelid, raportivaade |

Kasutajateekond: töövoog → andmed (käsitsi või CSV) → eeldused → hinnarežiim (CSV korral) → arvuta → tulemused, stsenaariumid, simulatsioon ja raport.

Peamised arvutusfailid asuvad `src/lib/calculators/` ja `src/lib/consumption/` ning `src/lib/market/` all; peamine kasutajaliides on `src/components/industrial-pv-battery-page.tsx`. Detailne failikaart: `docs/projekt-2/tehniline-ulevaade.md`.

---

## 7. Lahenduse teostus

### 7.1 Platvormi fookuse korrastamine

Tööstusmoodul paigutati marsruudile `/kalkulaatorid/toostus` koos pealkirja ja metaandmetega. Leht kasutab olemasolevat kalkulaatori kesta (`CalculatorRouteShell`) ja keskendub ühele ülesandele: tööstuslik PV + aku hinnang. See korrastas platvormi fookust: tööstusanalüüs on eraldi tööriist, mitte hajutatud osade kogum.

### 7.2 Tööstusmooduli v0.1 põhimudel

Fail: `src/lib/calculators/industrial.ts`.

Sisendid: aastane tarbimine, päevane osakaal, tipukoormus, PV võimsus ja tootlikkus, aku maht ja võimsus, aku eesmärk (omatarve või peak shaving), elektri ostuhind.

Lihtsustatud loogika:

- PV toodang = võimsus × spetsiifiline tootlikkus;
- omatarve sõltub päevasest osakaalust ja kattuvuse eeldusest;
- aku suurendab omatarvet (omatarbe režiim) või vähendab tippu (peak shaving);
- tippu ei lõigata omatarbe režiimis.

Tulemuseks on energiavood, tipu enne/pärast ning tekstiline kokkuvõte. See etapp andis esmase arvutusmudeli, mille peale hilisemad kihid ehitati.

### 7.3 CSV tarbimisprofiili import

Failid: `parse-consumption-csv.ts`, `consumption-profile.ts`.

Kuidas CSV import töötab:

1. Kasutaja valib režiimi „CSV import“ ja laadib faili.
2. Parser otsib ajatempli veergu (`timestamp`, `aeg`, `date`, `datetime`) ja tarbimise veergu (`consumption_kwh` jt lubatud nimed).
3. Toetatud on koma, semikoolon või tabulatsioon; negatiivne tarbimine lükatakse tagasi selge veateatega.
4. Kokkuvõte arvutab ridu, perioodi, tipu, keskmise, päeva/öö osakaalu (08:00–20:00) ja intervalli (1 h / 15 min / ebaregulaarne).
5. Kui periood ei kata peaaegu aastat, skaleeritakse tarbimine 8760 tunni peale.
6. Vormiväljad täidetakse kokkuvõttest; kasutaja saab neid käsitsi muuta.

See etapp võimaldas kasutada ettevõtte enda tarbimisandmeid, mitte ainult näidisprofiile.

### 7.4 Tarbimisprofiili graafik ja raportivaade

Failid: `consumption-profile-insight.ts`, graafiku komponent, lehe raportiplokk.

- Insight klassifitseerib profiili (päevane / ühtlane / tipukas) ja soovitab aku rolli.
- Graafik kuvab koormust ajas; suure seeria korral agregeeritakse (kuni umbes 96 punkti).
- Raportivaade (`#industrial-report`) koondab sisendid, profiili, hinnarežiimi, tulemused, stsenaariumid, simulatsiooni, järelduse ja piirangud. v1.0-s ilmub raport pärast arvutust. PDF eksporti ei ole.

See etapp tegi tulemused aruande ja kaitsmise screenshotiks sobivaks.

### 7.5 Stsenaariumite võrdlus

Fail: `industrial-scenarios.ts`.

Kuidas stsenaariumite võrdlus töötab:

1. Pärast arvutust kutsutakse `calculateIndustrialScenarios` sama sisendi peal.
2. Neli stsenaariumi: baas; ainult PV; PV + aku omatarve; PV + aku peak shaving.
3. Iga stsenaarium kasutab sama `calculateIndustrial` mudelit erineva konfiguratsiooniga.
4. Investeeringud arvutatakse ühikhindadest (PV €/kW, aku €/kWh); baas on 0.
5. Automaatne lühijäreldus toob välja suurima kogumõju, lühima tasuvuse ja tipu vähendamise.

See etapp võimaldab võrrelda valikuid ühes vaates, mitte ainult ühte konfiguratsiooni.

### 7.6 Majandusmudeli täiendamine

v0.5 tasemel täiendati mudelit:

- PV CAPEX (€/kW) ja aku CAPEX (€/kWh);
- võrku müügihind (€/MWh);
- võimsustasu (€/kW/kuu, peak shaving);
- aku kasutegur ja kasutatav maht (DoD).

Aastane kogumõju = omatarbe sääst + müügitulu + (vajadusel) võimsustasu sääst. Lihtsustatud tasuvus = investeering / aastane kogumõju, kui mõlemad on positiivsed.

### 7.7 Ajapõhine PV ja aku simulatsioon

Fail: `industrial-timeseries.ts`.

Kuidas ajapõhine simulatsioon töötab:

1. Eeldab CSV tarbimisridu ja arvutatud sisendeid.
2. Iga sammu kohta võetakse tarbimine CSV-st.
3. PV jaotatakse lihtsustatud päevakõvera ja kuuteguri järgi; perioodi summa seotakse aastatoodanguga.
4. Aku töötab ahnusloogikaga: omatarbe režiimis laeb ülejäägist ja tühjeneb puudujääki; peak shavingus sihttase tipu lähedal.
5. Võrgu ost ja müük jäävad energiabilansi jäägina.
6. Majandusvaade arvutab perioodi kogumõju ja aastaks skaleeritud hinnangu.

Oluline piirang: aku dispetšerit börsihinna järgi ei optimeerita. Hinnad mõjutavad rahalist arvestust, mitte aku käitumist.

### 7.8 Hinnaseeria ja Elering EE hinnarežiim

Failid: `parse-price-csv.ts`, `match-price-series.ts`; Eleringi päring kasutajaliidesest.

Kuidas hinnaseeria töötab:

1. CSV tarbimine peab olema laetud.
2. Kasutaja valib režiimi: keskmine hind, hinnaseeria CSV või Elering EE.
3. Hinnaseeria CSV veerud: `timestamp`, `buy_price_eur_mwh`, `export_price_eur_mwh`.
4. Sidumine tarbimisridadega: täpne ajatempli → sama tund → lähim (vaikimisi kuni 2 h) → keskmine varu.
5. Elering EE laeb NPS EE hinna perioodi jaoks; müügihinnaks kasutatakse vormi müügihinda. Ebaõnnestumisel kasutatakse keskmist hinda ja kuvatakse teade.
6. Seotud hinnad antakse ajapõhise majandusvaate sisendiks.

### 7.9 Demoandmed ja v1.0 kvaliteedikontroll

Fail: `src/lib/industrial/demo-data.ts`.

- `demo-tarbimine.csv`: 7 × 24 h (2026-03-01 … 03-07);
- `demo-hinnad.csv`: sama perioodi ostu- ja müügihinnad.

v1.0 kvaliteedikontrolli fookus oli demo teekond, selged veateated, käsitsi režiimi eraldamine CSV-st, raport pärast arvutust ning automaattestid koos `next build`-iga. Suuri uusi funktsioone v1.0 lõppfaasis ei lisatud; hiljem tehti ka visuaalne polish (paigutus ja loetavus), mis arvutusloogikat ei muutnud.

---

## 8. Testimine

Automaattestid (Vitest) katavad aastast mudelit, stsenaariume, ajapõhist simulatsiooni ja majandust, tarbimisprofiili, hinnaseeriat, demoandmeid ning demo teekonda.

| Fail | Asukoht |
|---|---|
| industrial.test.ts | src/lib/calculators/ |
| industrial-scenarios.test.ts | src/lib/calculators/ |
| industrial-timeseries.test.ts | src/lib/calculators/ |
| industrial-timeseries-economics.test.ts | src/lib/calculators/ |
| consumption-profile.test.ts | src/lib/consumption/ |
| consumption-profile-insight.test.ts | src/lib/consumption/ |
| price-series.test.ts | src/lib/market/ |
| demo-data.test.ts | src/lib/industrial/ |
| demo-journey.qa.test.ts | src/lib/industrial/ |

| Kontroll | Tulemus |
|---|---|
| Vitest, 9 faili | 65 / 65 testi läbis |
| next build | õnnestus |

Käsitsi kontrolliti muu hulgas: lehe avamine, demo CSV allalaadimine ja import, hinnaseeria sidumine (168 / 168), arvutus, stsenaariumid, ajapõhine simulatsioon ja majandusvaade, raport pärast arvutust, käsitsi režiim ilma CSV-ta ning mobiilivaade ilma leheülese horisontaalse kerimiseta.

Demoandmetega kogu kasutajateekond töötab. Käsitsi sisestamise režiim töötab. Raportivaade on screenshotiks sobiv.

Täielik testimise kokkuvõte: `docs/projekt-2/testimise-kokkuvote.md`. Seal on märkus, et dokumendi koostamise käigus teste uuesti ei käivitatud; seis peegeldab v1.0 lõplikku kvaliteedikontrolli. Kui pärast seda tehakse uusi muudatusi, tuleks testid uuesti käivitada (vajab käsitsi täpsustamist).

---

## 9. Tulemuste analüüs

Demoandmetega (kaitsmise teekonna näide):

- tarbimisprofiil: 168 rida, umbes 1 h intervall, hinnanguline aastane tarbimine umbes 491 MWh, päevane osakaal umbes 65 %;
- hinnaseeria: 168 / 168 sidumist ilma olulise hoiatuseta;
- pärast arvutust ilmuvad põhitulemus, neli stsenaariumi, ajapõhine simulatsioon koos majandusvaatega ning raportivaade.

Tulemused sõltuvad eeldustest (CAPEX, hinnad, aku režiim). Aastane mudel ja ajapõhine majandus võivad anda erineva aastaks skaleeritud euro-arvu, sest esimene põhineb profiili kokkuvõttel ja teine perioodi sammudel. See on ootuspärane lihtsustuste juures ja tuleb aruandes piiranguna välja öelda.

*Vajab käsitsi täpsustamist:* kui aruandes esitatakse konkreetsed numbrid tabelina või joonistel, tuleks need pärast lõplikku demo käiku uuesti salvestada (screenshotide juhend: `docs/projekt-2/screenshot-list.md`).

---

## 10. Piirangud ja edasiarendus

**Teadaolevad piirangud (v1.0), mis jäid alles:**

- PV tootmisprofiil on lihtsustatud (päevakõver + kuutegur), mitte mõõdetud ega detailne;
- aku on reeglipõhine (ahnusloogika), mitte börsihinna optimeerija;
- lühike CSV skaleeritakse aastaks;
- hinnaseeria / Elering mõjutab rahalist arvestust, mitte aku dispetšerit;
- Eleringi müük = vormi müügihind; API võib ebaõnnestuda;
- ajatemplid käsitletakse ajavööndita („naive“);
- PDF eksporti ei ole;
- tulemused on esmane hinnang, mitte investeerimisotsus;
- stsenaariumite lai tabel võib mobiilis sisemiselt horisontaalselt kerida.

**Edasiarendus, sh võimalik magistritöö fookus:**

- börsihinna põhine aku dispetšer;
- parem PV tootmisprofiil (mõõdetud andmed või väline tootmisallikas);
- PDF / struktureeritud eksport;
- pikemate andmestike ja ajavööndi teadlik käsitlus;
- tundlikkusanalüüs CAPEX-i ja hinna suhtes;
- võrdlus professionaalse modelleerimistööriistaga (vajab käsitsi täpsustamist, millise tööriistaga).

---

## 11. Kokkuvõte

Projekt 2 teostas Energiakalkulaator.ee tööstusmooduli v1.0: käsitsi ja CSV sisend, majanduslikud eeldused, stsenaariumite võrdlus, ajapõhine simulatsioon hinnarežiimidega, demoandmed ja raportivaade. Lahendus vastab eesmärgile anda läbipaistev esmane hinnang.

Uurimisküsimusele vastus: jah, veebipõhise mooduliga on võimalik struktureerida tarbimisprofiil ja lihtsustatud eeldused nii, et tulemus on arusaadav ning piirangud on sõnastatud — tingimusel, et kasutaja ei tõlgenda tulemust lõpliku investeerimisotsusena. Automaattestid (65 / 65) ja `next build` kinnitasid stabiilsust; käsitsi kontroll kinnitas demo- ja käsitsi teekonna ning raportivaate.

---

## 12. Lisad

Soovitatavad lisad Wordi aruandes:

- **Lisa A.** Demo CSV struktuuri näidis (`timestamp,consumption_kwh` ja hinnaseeria veerud).
- **Lisa B.** Stsenaariumite võrdluse ekraanikuva.
- **Lisa C.** Raportivaate ekraanikuva.
- **Lisa D.** Testimise kokkuvõte (`docs/projekt-2/testimise-kokkuvote.md`).
- **Lisa E.** Tehniline ülevaade (`docs/projekt-2/tehniline-ulevaade.md`).
- **Lisa F.** Kaitsmise demo skript (`docs/projekt-2/demo-script.md`).
- **Lisa G.** Screenshotide nimekiri (`docs/projekt-2/screenshot-list.md`).

Kaitsmise demo sammud: `docs/projekt-2/demo-script.md`.
