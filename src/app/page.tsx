import Link from "next/link";
import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} — börsihind, PV ja tööstusanalüüs`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
};

const tools = [
  {
    title: "Tööstusanalüüs",
    description:
      "Peamine tööriist: hinda PV ja aku mõju tarbimisprofiili, hinnaseeria ja stsenaariumite põhjal.",
    href: "/kalkulaatorid/toostus",
    cta: "Ava tööstusanalüüs",
    featured: true,
  },
  {
    title: "Börsihind",
    description: "Vaata Eesti elektri börsihinda, odavaimaid tunde ja päeva kokkuvõtet.",
    href: "/borsihind",
    cta: "Ava börsihind",
    featured: false,
  },
  {
    title: "PV arvutus",
    description: "Hinda päikesejaama tootlust, omatarvet ja tasuvust sisestatud andmete põhjal.",
    href: "/kalkulaatorid/paikesejaam",
    cta: "Ava PV arvutus",
    featured: false,
  },
  {
    title: "Peak shaving",
    description: "Hinda, kas aku aitab lõigata tipukoormust ja vähendada võimsustasu.",
    href: "/kalkulaatorid/peak-shaving",
    cta: "Ava peak shaving",
    featured: false,
  },
];

const logic = [
  {
    title: "Tarbimine",
    text: "Tarbimisprofiil näitab, millal elektrit kasutatakse — käsitsi või CSV-st.",
  },
  {
    title: "Tootmine",
    text: "PV arvutus näitab, kui palju toodangust saab kohapeal kasutada.",
  },
  {
    title: "Salvestus",
    text: "Aku aitab suurendada omatarvet või vähendada tipukoormust, sõltuvalt valitud eesmärgist.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "et-EE",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-ek-512.png`,
        width: 512,
        height: 512,
      },
      email: "kennethalto95@gmail.com",
    },
  ],
};

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="max-w-3xl">
        <p className="text-sm text-zinc-500">Energiakalkulaator.ee</p>
        <h1 className="mt-4 text-balance text-[1.85rem] font-semibold leading-tight tracking-tight text-zinc-50 sm:text-4xl">
          Energiaanalüüs tööstusele ja ettevõttele
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">
          Vaata börsihinda, hinda päikesejaama ja tipukoormust ning analüüsi PV + aku mõju tarbimisprofiili
          põhjal. Mõeldud esimeseks, läbipaistvaks hinnanguks — mitte lõplikuks investeerimisotsuseks.
        </p>
        <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
          <Link
            href="/kalkulaatorid/toostus"
            className="btn-glow inline-flex w-full px-5 py-3 sm:w-auto"
          >
            Ava tööstusanalüüs
          </Link>
          <Link
            href="/borsihind"
            className="btn-ghost inline-flex w-full justify-center px-5 py-3 sm:w-auto"
          >
            Vaata börsihinda
          </Link>
          <Link
            href="/kalkulaatorid/paikesejaam"
            className="btn-ghost inline-flex w-full justify-center px-5 py-3 sm:w-auto"
          >
            Ava PV kalkulaator
          </Link>
        </div>
      </section>

      <section className="mt-14 sm:mt-16">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">Tööriistad</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Alusta tööstusmoodulist, kui sul on tarbimisprofiil või soovid võrrelda PV ja aku stsenaariume.
        </p>
        <div className="site-board mt-5">
          <div className="site-board-grid site-board-grid-2 site-board-grid-4">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`site-board-cell min-h-[11.5rem] ${
                  tool.featured ? "border-zinc-500/50 bg-zinc-900/50 sm:col-span-2 lg:col-span-1" : ""
                }`}
              >
                {tool.featured ? (
                  <span className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-zinc-500">
                    Peamine tööriist
                  </span>
                ) : null}
                <h3 className={`text-base font-semibold text-zinc-100 ${tool.featured ? "mt-1" : ""}`}>
                  {tool.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{tool.description}</p>
                <span className="mt-4 text-sm font-medium text-zinc-200">{tool.cta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14 sm:mt-16">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">Kuidas analüüs töötab</h2>
        <div className="site-board mt-5">
          <div className="site-board-grid site-board-grid-3">
            {logic.map((item) => (
              <div key={item.title} className="site-board-cell">
                <h3 className="text-base font-semibold text-zinc-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-board mt-14 p-5 sm:mt-16 sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">Usaldusväärsus</h2>
        <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-400 sm:text-base">
          <li>Tulemused on hinnangulised ja sõltuvad sisestatud andmetest ning eeldustest.</li>
          <li>See ei ole lõplik investeerimis-, finants- ega tehniline nõuanne.</li>
          <li>Sisendandmete kvaliteet (tarbimine, hinnad, investeeringud) mõjutab tulemust otseselt.</li>
          <li>Börsihinnad ja investeeringukulud võivad aja jooksul muutuda.</li>
        </ul>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-500">
          Platvorm on arendatud ülikooliprojekti raames. Metoodika ja piirangud on kirjas projekti lehel.
        </p>
        <Link href="/projekt" className="mt-4 inline-flex text-sm font-medium text-zinc-200 underline underline-offset-4">
          Loe projekti kohta
        </Link>
      </section>
    </main>
  );
}
