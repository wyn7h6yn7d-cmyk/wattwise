import Link from "next/link";

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

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8">
      <section className="max-w-3xl">
        <p className="text-sm text-emerald-200/80">Projekt 2 prototüüp · Energiakalkulaator.ee</p>
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
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex min-h-[11.5rem] flex-col rounded-xl border border-emerald-800/50 bg-[#0b1a14]/88 p-5 transition-colors hover:border-emerald-500/50"
            >
              <h3 className="text-base font-semibold text-zinc-100">{tool.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{tool.description}</p>
              <span className="mt-4 text-sm font-medium text-zinc-200">{tool.cta}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14 sm:mt-16">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">Analüüsi loogika</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {logic.map((item) => (
            <div key={item.title} className="rounded-xl border border-emerald-800/50 bg-[#0b1a14]/88 p-5">
              <h3 className="text-base font-semibold text-zinc-100">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-xl border border-emerald-800/50 bg-[#0b1a14]/88 p-5 sm:mt-16 sm:p-6">
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
