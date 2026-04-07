"use client";

export function ValuePropsSection() {
  return (
    <section className="section">
      <header className="section-head">
        <h2 className="section-h2">Miks valida Energiakalkulaator</h2>
        <p className="section-sub">
          Premium, lihtne ja usaldusväärne ülevaade — nii kodu kui ettevõtte energiaotsuste toetamiseks.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          ["Kiire tasuta hinnang", "Sisesta põhiandmed ja saa kohe arusaadav tulemus."],
          ["Mitu kalkulaatorit ühes kohas", "Päikesejaam, VPP, paketid, EV laadimine ja peak shaving."],
          ["Selgemad energiaotsused", "Näed suurusjärke, võrdlusi ja peamisi mõjutegureid."],
          ["Detailne analüüs lisatasuga", "Täisanalüüs avab rahavoo ja lisablokid, PDF lisab raporti."],
        ].map(([t, d]) => (
          <article key={t} className="feature-card">
            <div className="feature-icon" />
            <h3 className="feature-title">{t}</h3>
            <p className="feature-desc">{d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

