# Screenshotide tegemise juhis — Projekt 2 aruanne

**Eesmärk:** teha Wordi aruande jaoks ühtsed ekraanipildid tööstusmooduli demo teekonnast.  
**Leht:** `/kalkulaatorid/toostus`  
**Allikad:** `aruande-koond.md`, `screenshot-list.md`, `demo-script.md`

See juhis **ei muuda koodi**. Screenshotid tehakse käsitsi brauseris pärast seda, kui rakendus jookseb (nt `npm run dev` või tootmisbuild).

---

## Katvuse kontroll (aruande vs nimekiri)

Allpool olevad **10 kohustuslikku faili** katavad `screenshot-list.md` punktid S1–S11 ja `aruande-koond.md` peamised pildikohad:

| Fail | Vastab nimekirjas | Peatükid / lisad |
|------|-------------------|------------------|
| `01-…` | S1 + S2 (algvaade + töövoog) | 1, 6, 7.1, 7.9 |
| `02-…` | S3 | 7.3 |
| `03-…` | S4 | 7.4 |
| `04-…` | S5 | 7.8 |
| `05-…` | S6 | 7.2, 7.6, 9 |
| `06-…` | S7 | 7.5, 9, Lisa B |
| `07-…` | S8 | 7.7 |
| `08-…` | S9 | 7.7, 7.8, 10 |
| `09-…` | S10 | 7.4, 7.9, Lisa C |
| `10-…` | S11 | 8, 7.9 |

**Järeldus:** aruande pildikohtade jaoks on 10 faili piisav. Lisa A (CSV struktuur) võib olla tekst/tabel, mitte screenshot. Eraldi S2 lähivõtet ei pea tegema, kui `01` näitab töövoogu ja demo nuppe selgelt.

---

## Üldised reeglid enne alustamist

1. Käivita rakendus (soovitus: enne lõplikke pilte `npm run build`, seejärel `npm run start` või `npm run dev`).
2. Ava **ainult** `/kalkulaatorid/toostus`.
3. Desktop: akna laius **~1280–1440 px**, brauseri zoom **90–100%**.
4. Alusta **puhtast olekust**: vajuta „Lähtesta“ või laadi leht uuesti.
5. Kasuta **ainult** demofaile: `demo-tarbimine.csv` ja `demo-hinnad.csv` (laadi lehe nuppudest alla).
6. Ära kasuta Elering EE-d screenshotide jaoks (võrgu risk); vali **Hinnaseeria CSV**.
7. Ära jäta pilti peale: DevTools, Cursor/React overlay, veateade, „Network offline“ bänner.
8. Välja lõika brauseri aadressiriba, kui juhendaja eelistab „puhast“ rakendust.
9. Salvesta PNG-d ühte kausta, nt `docs/projekt-2/screenshots/` (kausta loomine on käsitsi).
10. Teosta screenshotid **järjekorras 01 → 09** ühe demo käigu peal; **10** tee eraldi mobiilivaates.

---

## Demo käik (ühine ettevalmistus 02–09 jaoks)

Tee üks kord järjest (pärast `01` tegemist või enne `02`):

1. Vajuta „Lähtesta“ (kui vaja).
2. Laadi alla `demo-tarbimine.csv` ja `demo-hinnad.csv`.
3. Vali andmerežiim **CSV import**.
4. Impordi `demo-tarbimine.csv`.
5. Kontrolli: tarbimisprofiili kokkuvõte nähtav; soovituslikud PV/aku väljad täidetud.
6. Hinnarežiim: **Hinnaseeria CSV** → impordi `demo-hinnad.csv`.
7. Kontrolli: sidumine umbes **168 / 168** (või sama perioodi ridade arv ilma olulise hoiatuseta).
8. Vajuta **„Arvuta tulemus“**.
9. Kontrolli: „Peamine tulemus“, stsenaariumid, ajapõhine simulatsioon, majandusvaade ja `#industrial-report` on nähtavad.

Seejärel kerige ja jäädvustage vastavad plokid allpool kirjeldatud failinimedega.

---

## 1. `01-toostusmooduli-algvaade.png`

| | |
|--|--|
| **Fail** | `01-toostusmooduli-algvaade.png` |
| **Leht** | `/kalkulaatorid/toostus` |
| **Enne** | „Lähtesta“ või lehe värske laadimine. **Ära** impordi CSV-d ega arvuta. Zoom 90–100%, laius ~1280–1440 px. |
| **Pildile** | Pealkiri / v1.0 bänner, plokk **„Töövoog“** (nummerdatud sammud või lühikirjeldus), nupud **„Laadi demo-tarbimine.csv“** / **„Laadi demo-hinnad.csv“**, andmerežiimi valik (käsitsi vs CSV) puhtas olekus. |
| **Aruande peatükk** | **1** Sissejuhatus; **6** Projekteerimine; **7.1**; **7.9** |

---

## 2. `02-demo-tarbimine-import.png`

| | |
|--|--|
| **Fail** | `02-demo-tarbimine-import.png` |
| **Leht** | `/kalkulaatorid/toostus` |
| **Enne** | Vali **CSV import** → impordi `demo-tarbimine.csv`. Ära veel arvuta. Hinnaseeria võib olla veel tühi. |
| **Pildile** | Faili nimi / importitud olek, tarbimisprofiili **kokkuvõte** (read, periood, tipp, päev/öö jms), märge et CSV andmed on sisse loetud. Vormiväljad võivad olla täidetud — see on okei. |
| **Aruande peatükk** | **7.3** CSV tarbimisprofiili import |

---

## 3. `03-tarbimisprofiili-graafik.png`

| | |
|--|--|
| **Fail** | `03-tarbimisprofiili-graafik.png` |
| **Leht** | `/kalkulaatorid/toostus` |
| **Enne** | Sama seis kui pärast `demo-tarbimine.csv` importi (arvutus pole kohustuslik). Kerige tarbimisprofiili graafiku ja järelduse juurde. |
| **Pildile** | **„Tarbimine ajas“** (või samaväärne) graafik + **„Tarbimisprofiili järeldus“** / insight tekst. |
| **Aruande peatükk** | **7.4** Tarbimisprofiili graafik ja raportivaade |

---

## 4. `04-hinnaseeria-import.png`

| | |
|--|--|
| **Fail** | `04-hinnaseeria-import.png` |
| **Leht** | `/kalkulaatorid/toostus` |
| **Enne** | CSV tarbimine juba laetud. Vali hinnarežiim **Hinnaseeria CSV** → impordi `demo-hinnad.csv`. Ära kasuta Eleringit. |
| **Pildile** | Hinnarežiimi valik (Hinnaseeria CSV aktiivne), imporditud `demo-hinnad.csv`, sidumise tulemus (eesmärk **168 / 168** või selge „seotud“ kokkuvõte ilma kriitilise veata). |
| **Aruande peatükk** | **7.8** Hinnaseeria ja Elering EE hinnarežiim |

---

## 5. `05-pohitulemus.png`

| | |
|--|--|
| **Fail** | `05-pohitulemus.png` |
| **Leht** | `/kalkulaatorid/toostus` |
| **Enne** | Pärast `demo-tarbimine.csv` + `demo-hinnad.csv` → **„Arvuta tulemus“**. |
| **Pildile** | Plokk **„Peamine tulemus“** (aastane kogumõju €/a) ja peamised mõõdikud selle all (omatarve, müük, tipp, tasuvus jms — mis lehel näha on). |
| **Aruande peatükk** | **7.2**; **7.6**; **9** Tulemuste analüüs |

---

## 6. `06-stsenaariumite-vordlus.png`

| | |
|--|--|
| **Fail** | `06-stsenaariumite-vordlus.png` |
| **Leht** | `/kalkulaatorid/toostus` |
| **Enne** | Pärast arvutust. Kerige stsenaariumite võrdluse juurde. |
| **Pildile** | Nelja stsenaariumi **tabel ja/või võrdlusriba** + automaatne lühijäreldus (kui nähtav). |
| **Aruande peatükk** | **7.5**; **9**; **Lisa B** |

---

## 7. `07-ajapohine-simulatsioon.png`

| | |
|--|--|
| **Fail** | `07-ajapohine-simulatsioon.png` |
| **Leht** | `/kalkulaatorid/toostus` |
| **Enne** | Pärast arvutust CSV peal (ilma CSV-ta ajapõhist plokki ei teki). |
| **Pildile** | Ajapõhise simulatsiooni kokkuvõte + graafik(ud): tarbimine vs PV ja/või aku SOC. |
| **Aruande peatükk** | **7.7** Ajapõhine PV ja aku simulatsioon |

---

## 8. `08-ajapohine-majandusvaade.png`

| | |
|--|--|
| **Fail** | `08-ajapohine-majandusvaade.png` |
| **Leht** | `/kalkulaatorid/toostus` |
| **Enne** | Sama arvutusseis. Kerige ajapõhise **majandusliku mõju** ploki juurde. |
| **Pildile** | Perioodi kogumõju, aastaks skaleeritud hinnang, omatarve/müük eurodes, hinnarežiimi silt (Hinnaseeria CSV). |
| **Aruande peatükk** | **7.7**; **7.8**; **10** Piirangud (skaleerimise / hinna eristus) |

---

## 9. `09-raportivaade.png`

| | |
|--|--|
| **Fail** | `09-raportivaade.png` |
| **Leht** | `/kalkulaatorid/toostus` → ankur `#industrial-report` |
| **Enne** | **Ainult pärast** „Arvuta tulemus“. Kui raportit ei ole, arvutus puudub — ära tee tühja lehe pilti. |
| **Pildile** | Kogu raportiplokk (või kaks osa: sisendid+tulemused; järeldus+piirangud), pealkiri „Tööstus: PV + aku raportivaade“ / v1.0. |
| **Aruande peatükk** | **7.4**; **7.9**; **Lisa C** |

*Märkus:* kui plokk on pikk, tee kaks faili `09a-…` ja `09b-…` ning märgi Wordis mõlemad Lisa C / peatükk 7.9 juurde.

---

## 10. `10-mobiilivaade.png`

| | |
|--|--|
| **Fail** | `10-mobiilivaade.png` |
| **Leht** | `/kalkulaatorid/toostus` |
| **Enne** | Chrome/Safari DevTools → seadme laius **~390 px** (nt iPhone). Värskenda. Soovitus: sama demo käik (CSV + hinnad + arvuta), et tulemus/raport oleks näha. Zoom 100%. |
| **Pildile** | Üks vaade, kus on loetav töövoog või peamine tulemus / raport; **ei** tohi olla leheülest horisontaalset kerimist. Stsenaariumite tabeli *sisene* kerimine on lubatud (teadaolev kompromiss). |
| **Aruande peatükk** | **8** Testimine; **7.9** |

---

## Lühike kontrollnimekiri

Enne Wordi tõstmist märgi:

- [ ] Enne lõplikke screenshotte käivitatud **`npm run build`** (soovituslik; kinnitab, et build on korras)
- [ ] Kasutatud **`demo-tarbimine.csv`** ja **`demo-hinnad.csv`**
- [ ] Raport (`09`) ilmub **alles pärast** „Arvuta tulemus“
- [ ] Piltidel **ei ole** DevTools overlayd, Cursori/Reacti veabännereid ega runtime errorit
- [ ] Zoom on **90–100%**; desktop ~1280–1440 px, mobiil ~390 px
- [ ] Failinimed on ühtsed: `01-…` … `10-…` täpselt nagu selles juhises
- [ ] Numbrid piltidel on sama demo käigu omad (ära sega käsitsi ja CSV käike)
- [ ] Brauseri riba lõigatud välja, kui aruande stiil seda nõuab

---

## Wordi vormistus (käsitsi)

- Joonise pealkirjad nt „Joonis 7.3 — Demo tarbimise CSV import“.
- Viita failinimedele lisas või pealkirjas.
- Lisa B = `06-…`; Lisa C = `09-…` (või `09a`/`09b`).
- Lisa G võib viidata sellele juhisele + `screenshot-list.md`.
- Konkreetsed euro-numbrid tekstis peavad klappima screenshotidega — kui teed pildid uuesti, uuenda ka peatükk **9** numbreid.

---

## Kokkuvõte

| Küsimus | Vastus |
|---------|--------|
| Kas screenshotide juhis valmis? | **Jah** — fail `docs/projekt-2/screenshotide-tegemise-juhis.md` (see dokument). |
| Kas aruandes on pildikohtade jaoks piisavalt materjali? | **Jah** — 10 faili katavad S1–S11 ja peamised peatükid 1, 6, 7.1–7.9, 8–10 ning Lisad B/C. |
| Mida inimene peab ise käsitsi tegema? | Käivitada rakendus, teha demo käik, salvestada 10 PNG-d, lisada Wordi joonisteks (pealkirjad/numbrid), kontrollida checklisti, vajadusel uuendada peatükk 9 numbreid piltide järgi. Koodi muuta ei tohi. |
