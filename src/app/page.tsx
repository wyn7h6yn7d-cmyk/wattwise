import Link from "next/link";
import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} — börsihind, PV ja tööstusanalüüs`,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
};

const tools = [
  {
    title: "Börsihind",
    description: "Vaata Eesti elektri börsihinda, odavaimaid tunde ja päeva kokkuvõtet.",
    href: "/borsihind",
    cta: "Ava börsihind",
  },
  {
    title: "PV arvutus",
    description: "Hinda päikesejaama tootlust, omatarvet ja tasuvust sisestatud andmete põhjal.",
    href: "/kalkulaatorid/paikesejaam",
    cta: "Ava PV arvutus",
  },
  {
    title: "Peak shaving",
    description: "Hinda, kas aku aitab lõigata tipukoormust ja vähendada võimsustasu.",
    href: "/kalkulaatorid/peak-shaving",
    cta: "Ava peak shaving",
  },
  {
    title: "Tööstusanalüüs",
    description: "Kombineeri PV, akusalvestus ja tarbimisprofiil ühes tööstusvaates.",
    href: "/kalkulaatorid/toostus",
    cta: "Ava tööstusanalüüs",
  },
];

const logic = [
  {
    title: "Tarbimine",
    text: "Tarbimisprofiil näitab, millal elektrit kasutatakse.",
  },
  {
    title: "Tootmine",
    text: "PV arvutus näitab, kui palju toodangust kasutatakse kohapeal.",
  },
  {
    title: "Salvestus",
    text: "Aku ja peak shaving näitavad, kas salvestus aitab vähendada tippe või suurendada omatarvet.",
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
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="max-w-3xl">
        <p className="text-sm text-zinc-500">Projekt 2 prototüüp · Energiakalkulaator.ee</p>
        <h1 className="mt-4 text-balance text-[1.85rem] font-semibold leading-tight tracking-tight text-zinc-50 sm:text-4xl">
          Tööstusettevõtte energiaanalüüs ühes tööriistas
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">
          Analüüsi börsihinda, PV tootmist, akusalvestust ja tipukoormust tegeliku või näidisliku
          tarbimisprofiili põhjal.
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
        </div>
      </section>

      <section className="mt-14 sm:mt-16">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">Neli tööriista</h2>
        <div className="site-board mt-5">
          <div className="site-board-grid site-board-grid-2 site-board-grid-4">
            {tools.map((tool) => (
              <Link key={tool.href} href={tool.href} className="site-board-cell min-h-[11.5rem]">
                <h3 className="text-base font-semibold text-zinc-100">{tool.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{tool.description}</p>
                <span className="mt-4 text-sm font-medium text-zinc-200">{tool.cta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14 sm:mt-16">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">Analüüsi loogika</h2>
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
        <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">Projekt ja metoodika</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Tööriist on arendamisel Projekt 2 raames. Tulemused on esmased hinnangud sisestatud andmete
          ja valitud eelduste põhjal, mitte lõplik investeerimisotsus.
        </p>
        <Link href="/projekt" className="mt-4 inline-flex text-sm font-medium text-zinc-200 underline underline-offset-4">
          Loe projekti lehelt
        </Link>
      </section>
    </main>
  );
}
