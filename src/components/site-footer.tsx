import Link from "next/link";
import Image from "next/image";
import { OpenCookieSettingsButton } from "@/components/legal/OpenCookieSettingsButton";
import { PUBLIC_TOOLS } from "@/lib/nav";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer-chrome relative z-10 mt-8">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:gap-6 lg:px-8 lg:py-7">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-zinc-800">
              <Image
                src="/logo.png"
                alt="Energiakalkulaator"
                width={40}
                height={40}
                sizes="40px"
                className="h-[92%] w-[92%] object-contain"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-100">Energiakalkulaator</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-zinc-400">
            <p className="font-medium text-zinc-300">Ülikooli projekt</p>
            <p className="mt-1 text-zinc-400">Kenneth Alto</p>
            <a className="mt-0.5 inline-flex text-zinc-400 hover:text-zinc-200" href="mailto:kennethalto95@gmail.com">
              kennethalto95@gmail.com
            </a>
            <div className="mt-2.5 space-y-1 text-xs leading-relaxed text-zinc-500">
              <p>Energiakalkulaator.ee on üliõpilastöö raames arendatud informatiivne analüüsiplatvorm.</p>
              <p>Tulemused on hinnangud, mitte finants- ega tehniline nõuanne.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-100">Tööriistad</div>
          <ul className="mt-3 grid gap-2 text-sm">
            {PUBLIC_TOOLS.map((tool) => (
              <li key={tool.href}>
                <Link className="text-zinc-400 hover:text-zinc-100" href={tool.href}>
                  {tool.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold text-zinc-100">Projekt</div>
          <ul className="mt-3 grid gap-2 text-sm">
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/projekt">
                Ülikooli töö
              </Link>
            </li>
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/kontakt">
                Kontakt
              </Link>
            </li>
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/kkk">
                Korduma kippuvad küsimused
              </Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <div className="text-sm font-semibold text-zinc-100">Juriidiline</div>
          <ul className="mt-3 grid gap-2 text-sm">
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/kasutustingimused">
                Kasutustingimused
              </Link>
            </li>
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/privaatsuspoliitika">
                Privaatsuspoliitika
              </Link>
            </li>
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/kupsised">
                Küpsised
              </Link>
            </li>
            <li>
              <OpenCookieSettingsButton className="text-zinc-400 hover:text-zinc-100">
                Küpsiste seaded
              </OpenCookieSettingsButton>
            </li>
            <li>
              <Link className="text-zinc-400 hover:text-zinc-100" href="/vastutusest-loobumine">
                Vastutusest loobumine
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800/80 py-3 text-center text-xs text-zinc-500">
        © {year} Energiakalkulaator · Ülikooli projekt
      </div>
    </footer>
  );
}
