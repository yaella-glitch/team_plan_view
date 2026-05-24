export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-rose-50" />
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.18), transparent 40%), radial-gradient(circle at 80% 30%, rgba(244,114,182,0.15), transparent 40%)',
        }}
      />
      <div className="mx-auto max-w-7xl px-8 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-700 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Team plan · living document
        </div>
        <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-ink sm:text-6xl lg:text-7xl">
          AI work platform PMMs
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted sm:text-xl">
          From Marketing, GTM, Product — supporting customers along the way in positioning monday as
          best AI work platform.
        </p>
      </div>
    </section>
  );
}
