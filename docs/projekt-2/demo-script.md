# Kaitsmise demo skript — tööstusmoodul v1.0

**Eesmärk:** ~5–8 minuti jooksul näidata kogu kasutajateekonda demoandmetega.  
**URL:** `/kalkulaatorid/toostus`  
**Ettevalmistus:** brauseri puhas olek (või „Lähtesta“); internet Eleringi jaoks pole kohustuslik — kasuta hinnaseeria CSV-d.

---

### 1. Ava `/kalkulaatorid/toostus`

**Räägi:** „See on Projekt 2 tööstusmoodul v1.0 — esmane hinnang PV ja aku mõjule, mitte lõplik investeerimisotsus.“

---

### 2. Näita töövoogu

**Räägi:** „Ülal on viis sammu: andmed, eeldused, hinnarežiim, arvutus, tulemused. All on nupud demo CSV-de allalaadimiseks.“

---

### 3. Laadi alla `demo-tarbimine.csv`

**Räägi:** „Demo on seitse päeva tunnise sammuga — piisav teekonna näitamiseks, mitte aasta mõõtmisandmestik.“

---

### 4. Impordi `demo-tarbimine.csv`

**Tee:** vali „CSV import“ → vali fail.  
**Räägi:** „Parser täidab tarbimise, tipu ja päevase osakaalu; demo fail täidab ka soovituslikud PV ja aku väärtused.“

---

### 5. Näita kokkuvõtet, graafikut ja järeldust

**Räägi:** „Kokkuvõte näitab perioodi ja tippu; graafik koormust ajas; järeldus seostab profiili PV sobivuse ja aku rolliga.“

---

### 6. Laadi alla `demo-hinnad.csv`

**Räägi:** „Hinnaseeria katab sama perioodi, et sidumine oleks kaitsmisel veatu.“

---

### 7. Vali hinnarežiim „Hinnaseeria CSV“

**Räägi:** „Kolm režiimi: keskmine hind, oma hinnaseeria või Elering EE. Hinnad mõjutavad majandust, mitte aku dispetšerit.“

---

### 8. Impordi `demo-hinnad.csv`

**Räägi:** „Siin peaks olema 168 / 168 seotud rida ilma olulise hoiatuseta — ajatemplid klapivad.“

---

### 9. Vajuta „Arvuta tulemus“

**Räägi:** „Nüüd jookseb aastane mudel, stsenaariumid ja ajapõhine simulatsioon sama sisendi peal.“

---

### 10. Näita põhitulemust

**Räägi:** „Peamine number on aastane kogumõju eurodes; all on omatarve, müük, tipp ja lihtsustatud tasuvus.“

---

### 11. Näita stsenaariumite võrdlust

**Räägi:** „Neli stsenaariumi: baas, ainult PV, PV+aku omatarve, PV+aku tipp. Automaatne järeldus toob välja suurima mõju, lühima tasuvuse ja tipu lõike.“

---

### 12. Näita ajapõhist simulatsiooni

**Räägi:** „Siin on samm-sammult PV, tarbimine ja aku SOC — lihtsustatud päevakõver ja ahnusloogika, mitte optimeerija.“

---

### 13. Näita majandusvaadet

**Räägi:** „Perioodi eurod tulevad hinnaseeriast; aastaks skaleerimine on hinnang lühikese andmestiku pealt.“

---

### 14. Näita raportivaadet

**Räägi:** „Veebiraport v1.0 on screenshotiks — sisendid, tulemused, järeldus ja piirangud ühes kohas. PDF-i selles versioonis ei ole.“

---

### 15. Ütle piirangud ja edasiarendus

**Räägi:** „Piirangud: lihtsustatud PV, reeglipõhine aku, lühikese CSV skaleerimine, hinnad ei juhi akut, pole PDF-i. Edasi: spot-optimeerija, parem PV profiil, eksport.“

---

## Varuplaanid

| Risk | Tegevus |
|------|---------|
| Demo CSV ei lae alla | Kasuta eelnevalt salvestatud faile või genereeri uuesti lehelt |
| Hinnaseeria ei kattu | Kontrolli, et mõlemad failid on samast demost |
| Elering ebaõnnestub | Ära kasuta live Eleringit kaitsmisel; jää hinnaseeria CSV juurde |
| Leht on „määrdunud“ | Vajuta „Lähtesta“ ja alusta uuesti |

## Kui küsitakse käsitsi režiimi kohta

Lülitu „Käsitsi sisestamine“ (CSV tühjeneb), vali näidisprofiil, arvuta.  
**Räägi:** „Ilma CSV-ta töötab aastane mudel ja stsenaariumid; ajapõhine sim vajab tarbimisprofiili ridu.“
