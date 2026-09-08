# Screenshotide nimekiri aruande jaoks

Soovitus: tee pildid pärast demo teekonna lõpuni viimist (pärast „Arvuta tulemus“).  
Akna laius: desktop ~1280–1440 px; mobiil ~390 px. Välja lõika brauseri riba, kui juhendaja eelistab.

---

### S1 — Tööstusmooduli algus (puhas olek)

| | |
|--|--|
| **Mida näidata** | Pealkiri, v1.0 bänner, „Kuidas alustada“, demo allalaadimisnupud, tühi / näidisprofiili valik |
| **Miks** | Näitab mooduli asukohta ja esmast töövoogu |
| **Peatükk** | 1 Sissejuhatus; 7.1; 7.9 |

---

### S2 — Töövoo juhis lähivaates

| | |
|--|--|
| **Mida näidata** | Nummerdatud 5 sammu + demo nupud |
| **Miks** | Dokumenteerib kasutajateekonna disaini |
| **Peatükk** | 6 Projekteerimine; 7.9 |

---

### S3 — CSV import ja tarbimisprofiili kokkuvõte

| | |
|--|--|
| **Mida näidata** | Valitud `demo-tarbimine.csv`, eelvaade, kokkuvõtte plokk (read, periood, tipp, päev/öö) |
| **Miks** | Tõestab CSV importi ja skaleeritud aastast hinnangut |
| **Peatükk** | 7.3 |

---

### S4 — Tarbimisprofiili graafik + järeldus

| | |
|--|--|
| **Mida näidata** | „Tarbimine ajas“ graafik ja „Tarbimisprofiili järeldus“ tekstid |
| **Miks** | Seostab andmed PV/aku soovitustega |
| **Peatükk** | 7.4 |

---

### S5 — Hinnaseeria import

| | |
|--|--|
| **Mida näidata** | Hinnarežiim „Hinnaseeria CSV“, `demo-hinnad.csv`, seos **168 / 168** (või tegelik demo tulemus) |
| **Miks** | Näitab hinnarežiimi ja ajatempli sidumist |
| **Peatükk** | 7.8 |

---

### S6 — Põhitulemus

| | |
|--|--|
| **Mida näidata** | „Peamine tulemus“ (aastane kogumõju €/a) + peamised mõõdikud |
| **Miks** | Aruande keskne tulemusekuva |
| **Peatükk** | 7.2; 7.6; 9 Tulemuste analüüs |

---

### S7 — Stsenaariumite võrdlus

| | |
|--|--|
| **Mida näidata** | Tabel / võrdlusriba + automaatne lühijäreldus |
| **Miks** | Näitab nelja stsenaariumi võrdlust |
| **Peatükk** | 7.5; 9 |

---

### S8 — Ajapõhine simulatsioon

| | |
|--|--|
| **Mida näidata** | Simulatsiooni kokkuvõte + tarbimine vs PV ja/või SOC graafik |
| **Miks** | Dokumenteerib ajapõhist kihti |
| **Peatükk** | 7.7 |

---

### S9 — Ajapõhine majandusvaade

| | |
|--|--|
| **Mida näidata** | Perioodi kogumõju, aastaks skaleeritud, omatarve/müük, hinnarežiimi silt |
| **Miks** | Eristab perioodi ja aastase hinnangu |
| **Peatükk** | 7.7; 7.8; 10 Piirangud |

---

### S10 — Raportivaade

| | |
|--|--|
| **Mida näidata** | Kogu `#industrial-report` plokk (või 2 osa: sisendid+tulemused; järeldus+piirangud) |
| **Miks** | Kaitsmise / aruande peamine screenshot |
| **Peatükk** | 7.4; 7.9; Lisa C |

---

### S11 — Mobiilivaade (soovituslik)

| | |
|--|--|
| **Mida näidata** | Sama leht ~390 px: töövoog, tulemus või raport ilma leheülase horisontaalse kerimiseta |
| **Miks** | UX / loetavuse tõestus |
| **Peatükk** | 8 Testimine; 7.9 |

*Märkus:* stsenaariumite lai tabel võib kaardis sees kerida — see on teadaolev kompromiss, mitte leheülene overflow.

---

## Soovituslik järjestus aruandes

1. S1 → S2 (kontekst)  
2. S3 → S4 → S5 (andmed)  
3. S6 → S7 → S8 → S9 (tulemused)  
4. S10 (raport)  
5. S11 (mobiil, kui mahub)

## Tehniline märkus

Numbrid piltidel sõltuvad eeldustest ja demo generatsioonist. Kui demoandmeid muudetakse, tee screenshotid uuesti.  
*Vajab käsitsi täpsustamist:* lõplikud jooniste pealkirjad ja joonise numbrid Wordis (nt „Joonis 5.3“).
