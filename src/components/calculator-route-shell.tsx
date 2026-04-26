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
    <section className="glass-panel rounded-3xl p-6 sm:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{description}</p>
      </header>
      <div className="mt-6">{children}</div>
    </section>
  );
}

