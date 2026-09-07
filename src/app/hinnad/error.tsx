export default function HinnadError() {
  return (
    <div className="relative page-bg">
      <main className="relative mx-auto w-full max-w-4xl px-5 pb-16 pt-12 sm:px-8 lg:px-10">
        <section className="glass-panel rounded-3xl p-8 sm:p-12">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">Lehte ei saanud avada</h1>
          <p className="mt-4 max-w-2xl text-zinc-300">
            Energiakalkulaator on ülikooli projekt. See aadress ei ole enam kasutusel.
          </p>
        </section>
      </main>
    </div>
  );
}
