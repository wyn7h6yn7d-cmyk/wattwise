# EnergiaTasuvus

Futuristlik ühe-leheline päikese + aku tasuvuskalkulaator (Next.js App Router + Tailwind CSS), kogu nähtav kasutajaliides eesti keeles.

## Kiire käivitus

```bash
npm install
npm run dev
```

Ava brauseris `http://localhost:3000`.

## Skriptid

- `npm run dev` - arendusreziim
- `npm run build` - tootmisbuild
- `npm run start` - käivita tootmisbuild
- `npm run lint` - koodikvaliteedi kontroll

## Struktuur

- `src/app/page.tsx` - avaleht
- `src/components/solar-calculator-page.tsx` - kogu UI + vorm + tulemuste visualiseerimine
- `src/lib/calculator.ts` - tasuvusloogika ja stsenaariumite võrdlus
- `src/app/api/nordpool/route.ts` - Nord Pool hinnaloogika (live + fallback)
- `src/types/calculator.ts` - sisendite/tulemite tüübid

## Nord Pool ühenduse laiendamine

Praegu:
- `manual` reziim töötab alati käsitsi sisestatud hinnaga.
- `nordpool` reziim proovib võtta Eesti keskmist hinda API kaudu.
- Kui päring ebaõnnestub, kasutatakse fallback-hinda ning kuvatakse kasutajale selge eestikeelne teade.

Hiljem saad:
1. Asendada `/api/nordpool/route.ts` sees andmeallika enda teenusega.
2. Lisada autentimisega API (nt partneri teenus) server-route kaudu.
3. Muuta arvestus tunnipõhiseks, kui sul on detailne tarbimisprofiil.

## Arvutuse eeldused (dummy, kuid realistlikud)

- Tootmisparandused: suund, varjutus, süsteemi kasutegur, hooajaline kordaja.
- Omakasutuse mudel: tarbimisprofiil + aku olemasolu + aku kasutatav maht.
- Rahavoog: elektrihinna kasv, süsteemi degradatsioon, diskontomäär, hoolduskulu.
- CO2 mõju: ligikaudne hinnang välditud võrgutarbimisest.

## Deploy

Projekt sobib otse Vercelisse:
1. impordi repo Vercelisse
2. build command: `npm run build`
3. output: Next.js vaikimisi

Soovi korral saab hiljem lisada ka staatilise ekspordi eraldi vajadustele.
