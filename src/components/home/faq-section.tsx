"use client";

export function FAQSection() {
  return (
    <section className="section">
      <header className="section-head">
        <h2 className="section-h2">KKK</h2>
        <p className="section-sub">Lühidalt: mida see tööriist teeb ja kuidas seda mõistlikult kasutada.</p>
      </header>

      <div className="grid gap-3">
        {[
          [
            "Kas tulemused on täpsed?",
            "Tulemused on informatiivsed ja sõltuvad sisenditest ning eeldustest. Täisanalüüs aitab näha rahavoogu ja riske detailsemalt.",
          ],
          [
            "Mida ma tasuta vaates näen?",
            "Põhitulemused ja kiire hinnangu. Detailne analüüs, lisagraafikud ja võrdlused avanevad pärast ostu.",
          ],
          [
            "Milleks PDF raport?",
            "PDF on professionaalne kokkuvõte, mida saad salvestada või partnerile saata. PDF on projekti-põhine lisatoode (2,99 €).",
          ],
          [
            "Kellele see sobib?",
            "Nii kodu kui ettevõtte jaoks. Peak shaving on eriti kasulik ettevõtetele; EV laadimine aitab koduses taristus teha mõistlikke valikuid.",
          ],
        ].map(([q, a]) => (
          <details key={q} className="faq-details rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <summary className="faq-summary font-medium text-zinc-100">{q}</summary>
            <p className="mt-2 pl-8 text-sm leading-relaxed text-zinc-300 md:text-base">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

