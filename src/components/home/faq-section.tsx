"use client";

import { FEATURES } from "@/lib/features";

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
            FEATURES.paywallEnabled
              ? "Tulemused on hinnangulised ja sõltuvad sisenditest ning eeldustest. Kui kasutad tulemust otsuse aluseks, tasub teha mitu stsenaariumi ja kontrollida sisendandmed üle."
              : "Tulemused on hinnangulised ja sõltuvad sisenditest ning eeldustest. Kui kasutad tulemust otsuse aluseks, tasub teha mitu stsenaariumi ja kontrollida sisendandmed üle.",
          ],
          [
            "Mida ma tasuta vaates näen?",
            FEATURES.paywallEnabled
              ? "Põhitulemused ja ülevaate. Tasulised lisavaated võivad tulevikus lisanduda."
              : "Hetkel on kõik kalkulaatorid beetaversioonina tasuta kasutamiseks.",
          ],
          [
            "Milleks PDF raport?",
            FEATURES.paywallEnabled
              ? "PDF on kokkuvõte, mida saad salvestada või jagada."
              : "PDF on kokkuvõte, mida saad salvestada või jagada (kui raporti funktsioon on konkreetses kalkulaatoris olemas).",
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

