"use client";

type UsedAssumptionsBlockProps = {
  userInputs: string[];
  defaultAssumptions: string[];
  apiValues?: string[];
  mostInfluentialInputs: string[];
};

function RowList({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-zinc-400">{emptyText}</p>;
  }
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-300">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function UsedAssumptionsBlock({
  userInputs,
  defaultAssumptions,
  apiValues = [],
  mostInfluentialInputs,
}: UsedAssumptionsBlockProps) {
  return (
    <article className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <h4 className="section-title">Kasutatud eeldused</h4>
      <p className="mt-2 text-sm text-zinc-300">
        Mida täpsemad sisendandmed, seda täpsem on tulemus.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-400">Kasutaja sisestatud andmed</p>
          <div className="mt-2">
            <RowList items={userInputs} emptyText="Sisestatud andmeid pole veel piisavalt." />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-400">Vaikimisi eeldused</p>
          <div className="mt-2">
            <RowList items={defaultAssumptions} emptyText="Kõik põhiväärtused on kasutaja poolt üle kirjutatud." />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-400">API-st tulnud väärtused</p>
          <div className="mt-2">
            <RowList items={apiValues} emptyText="Selles arvutuses API andmeid ei kasutatud." />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-400">Kõige suurema mõjuga sisendid</p>
          <div className="mt-2">
            <RowList items={mostInfluentialInputs} emptyText="Peamisi mõjureid ei saanud veel hinnata." />
          </div>
        </div>
      </div>
    </article>
  );
}
