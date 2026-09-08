# Testimise kokkuvõte — tööstusmoodul v1.0

Käesolev kokkuvõte põhineb Projekt 2 tööstusmooduli v1.0 lõplikul kvaliteedikontrollil (Vitest, `next build` ning käsitsi / brauseris kontrollitud kasutajateekond). Selle dokumendi koostamise käigus teste ega tootmise buildi uuesti ei käivitatud; alltoodud seis peegeldab varasemat v1.0 lõplikku kontrolli.

---

## 1. Testifailid

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

Kokku: 9 testifaili. Lõplikul kvaliteedikontrollil läbis **65 / 65** testi.

---

## 2. Mida iga testifail kontrollib

### industrial.test.ts

- PV toodang = võimsus × tootlikkus
- Päevane osakaal tõstab omatarvet
- Aku omatarve ei ületa eksporditavat PV-d
- Peak shaving lõikab tippu, aga mitte alla eelduslikku põrandat
- Omatarbe režiimis tippu ei lõigata
- Sisendite sanitiseerimine
- Ühikhinna investeering ja tasuvus
- Eksporttulu ja võimsustasu (ainult tipurežiimis)
- Näidisprofiilide lõplikud tulemused

### industrial-scenarios.test.ts

- Baas: null mõju / null investeering
- Ainult PV vs PV+aku investeering
- Eksport ja võimsustasu stsenaariumites
- Tasuvus stsenaariumi investeeringu põhjal
- Suurima mõjuga stsenaariumi tuvastus
- Energiavood ühtivad calculateIndustrial-iga ainult PV korral

### industrial-timeseries.test.ts

- PV öösel umbes 0, päeval suurem kui 0
- Aku laetus piirides, võimsuspiirid kehtivad
- Omatarbe aku suurendab kohapealset kasutust
- Peak shaving vähendab tippvõrguvõimsust
- Vahelduvvoolu energia balanss sammu kohta

### industrial-timeseries-economics.test.ts

- Võrguost väheneb PV-ga
- Omatarve hinnatud ostuhinnaga, müük müügihinnaga
- Võimsustasu tipurežiimis
- Aastaks skaleerimine kaetud tundide järgi
- Nullhinnad annavad null eurot; keskmised hinnad rakenduvad sammudes

### consumption-profile.test.ts

- Koma- ja semikooloniga CSV
- Vigased / puuduvad veerud, tühi fail, negatiivne tarbimine
- Summad, tipp, päevane osakaal kella 08–20
- 1 h / 15 min / ebaregulaarne intervall

### consumption-profile-insight.test.ts

- Päevane / ühtlane / tipukas kuju
- Aku soovitus (omatarve või tipu lõikamine)
- Graafiku agregeerimine suure seeria korral

### price-series.test.ts

- Hinnaseeria parseerimine (koma / semikoolon)
- Puuduv veerg annab veateate
- Ajatempli sidumine ja hoiatus puuduliku katte korral
- Keskmise hinna ja hinnaseeria mõju majandusele

### demo-data.test.ts

- Demo tarbimine ja hinnad: 7 × 24 rida, kattuvad ajatemplid

### demo-journey.qa.test.ts

- Täisteekond: demo CSV → sidumine (0 sidumata) → arvutus + stsenaariumid + ajapõhine simulatsioon
- Käsitsi arvutus ilma ajapõhise simulatsioonita
- Selged veateated puuduva ajatempli / tarbimise / ostuhinna veeru korral
- Hoiatus, kui hinnaseeria ei kata kogu perioodi

---

## 3. Lõplik automaattestide seis

| Kontroll | Tulemus |
|---|---|
| Vitest, 9 faili | 65 / 65 testi läbis |
| next build | õnnestus |

Märkus: kui pärast lõplikku kontrolli tehakse uusi muudatusi, tuleks testid ja build uuesti käivitada ning see tabel ajakohastada. See vajab käsitsi täpsustamist.

---

## 4. Käsitsi kontrollitud sammud

Järgmised sammud kontrolliti lõplikul kvaliteedikontrollil:

1. Lehe avamine puhta olekuga
2. Töövoo arusaadavus (sammud + demo nupud)
3. Demo tarbimise allalaadimine ja import
4. Kokkuvõte, graafik ja järeldus
5. Demo hinna allalaadimine, hinnaseeria valik ja import
6. Sidumine 168 / 168 ilma olulise hoiatuseta
7. Arvutus: põhitulemus, stsenaariumid, ajapõhine simulatsioon, majandusvaade, raport
8. Raport pärast arvutust, v1.0 silt, loetavus (screenshotiks sobiv)
9. Käsitsi režiim: CSV-spetsiifilised paneelid ei sega; tühioleku tekst simulatsiooni kohta
10. Veateated: vigane või puuduv veerg tarbimisel ja hinnaseerial; puudulik hinnakate
11. Eleringi ebaõnnestumise tekst ja varulahendus (silt ning teade koodis)
12. Disain: uut rohelist ei lisatud; leheülene horisontaalne ülevool on peidetud

Demoandmetega kogu kasutajateekond töötab. Käsitsi sisestamise režiim töötab ilma CSV-ta. Raportivaade on screenshotiks sobiv.

Märkus brauseri arendushoiatuste kohta: automatiseerimise tööriist võib lisada `data-cursor-ref` atribuute, mis Next.js arenduskihis võivad näida hydration-veana. See ei ole rakenduse enda serveri- ja kliendipoolse sisu erinevus. Kui juhendaja nõuab, tuleks kinnitus teha puhtas Chrome’is ilma automatiseerimiseta (vajab käsitsi täpsustamist).

---

## 5. Piirangud, mis jäid alles

Teadaolevad piirangud jäid alles:

- Lihtsustatud PV tootmisprofiil
- Reeglipõhine (ahnus) aku — ei ole börsihinna optimeerija
- Lühike CSV skaleeritakse aastaks
- Hinnaseeria / Elering mõjutab rahalist arvestust, mitte aku dispetšerit
- Eleringi müük = vormi müügihind; API võib ebaõnnestuda
- Ajavööndita („naive“) ajatemplid
- PDF eksport puudub
- Tulemused on esmane hinnang, mitte investeerimisotsus
- Stsenaariumite lai tabel võib mobiilis sisemiselt horisontaalselt kerida

---

## 6. Soovitus aruande tekstiks

Automaattestid (65 / 65) ja tootmise build (`next build`) kinnitasid tööstusmooduli v1.0 arvutus- ja demo-teekonna stabiilsust. Käsitsi kontroll kinnitas kasutajateekonna, veateated ja raportivaate. Järelejäänud piirangud on teadlikud lihtsustused, mitte avastamata vead.
