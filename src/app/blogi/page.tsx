import Link from "next/link";
import { LegalLayout } from "@/app/(legal)/legal-layout";

const posts = [
  {
    title: "Kuidas võrrelda spoti ja fikseeritud paketti",
    excerpt: "Lihtne raamistik, kuidas hinnata riski, stabiilsust ja kulude vahet.",
    href: "/kalkulaatorid/elektripaketid",
  },
  {
    title: "EV laadija valik kodus: 1f vs 3f",
    excerpt: "Peakaitse, reservkoormus ja laadimiskiiruse kompromissid.",
    href: "/kalkulaatorid/ev-laadimine",
  },
  {
    title: "Peak shaving ettevõttes: kust sääst tekib",
    excerpt: "Võimsustasu loogika ning aku võimsuse/mahu mõju.",
    href: "/kalkulaatorid/peak-shaving",
  },
];

export default function BlogPage() {
  return (
    <LegalLayout title="Blogi" updatedAt="25.04.2026">
      <p className="mt-2">
        Praktilised artiklid energiaotsuste jaoks. Täispikk blogi on beetaversioonis täienemas.
      </p>
      <div className="mt-6 grid gap-3">
        {posts.map((post) => (
          <article key={post.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h2 className="text-base font-semibold text-zinc-50">{post.title}</h2>
            <p className="mt-2 text-sm text-zinc-300">{post.excerpt}</p>
            <Link href={post.href} className="mt-3 inline-flex text-sm text-emerald-200 underline underline-offset-4">
              Ava seotud kalkulaator
            </Link>
          </article>
        ))}
      </div>
    </LegalLayout>
  );
}
