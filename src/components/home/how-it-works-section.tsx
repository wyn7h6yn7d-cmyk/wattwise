"use client";

export function HowItWorksSection() {
  return (
    <section className="section">
      <header className="section-head">
        <h2 className="section-h2">Kuidas see töötab?</h2>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["1) Sisesta andmed", "Anna oma tarbimisandmed või valitud eeldused."],
          ["2) Arvutame võimalused", "Tööriistad arvutavad säästu ja tasuvuse."],
          ["3) Tee targad otsused", "Võrdle tulemusi ja vali parim lahendus."],
        ].map(([title, desc], index) => (
          <article
            key={title}
            className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
          >
            {index < 2 ? (
              <div className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-4 bg-emerald-300/45 lg:block" />
            ) : null}
            <div className="mb-3 text-sm font-semibold text-emerald-200">{title}</div>
            <p className="text-sm leading-relaxed text-zinc-400">{desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

