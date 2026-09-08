export function CalculatorRouteShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative mx-auto w-full max-w-full">
      <header className="max-w-3xl">
        <h1 className="text-[1.65rem] font-semibold tracking-tight text-zinc-50 sm:text-3xl sm:leading-tight">
          {title}
        </h1>
        <p className="mt-2.5 text-[0.95rem] leading-relaxed text-zinc-400 sm:text-base">{description}</p>
      </header>
      <div className="mt-8">{children}</div>
    </section>
  );
}
