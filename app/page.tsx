import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center max-w-3xl px-6">

        <p className="uppercase tracking-[0.3em] text-blue-400 text-sm font-semibold">
          RestorationOS
        </p>

        <h1 className="mt-6 text-6xl md:text-7xl font-bold tracking-tight">
          Every Loss.
          <br />
          One Digital Twin.
        </h1>

        <p className="mt-8 text-xl text-slate-400 leading-relaxed">
          Restore buildings.
          <br />
          We'll build the Twin.
        </p>

        <Link
          href="/new-loss"
          className="mt-14 inline-block rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold shadow-xl transition-all duration-300 hover:bg-blue-500 hover:scale-105"
        >
          Build Digital Twin
        </Link>

      </div>
    </main>
  );
}