import Header from "../../components/header";
import Link from "next/link";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-6xl">

        <Header
          title="Digital Twin"
          subtitle="The building is your source of truth."
        />

        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Building</h2>

            <p className="mt-4 text-slate-400">
              123 Main Street
            </p>

            <p className="text-slate-500">
              Columbia, Missouri
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="text-xl font-bold">
              Twin Health
            </h2>

            <div className="mt-5 h-3 rounded-full bg-slate-700">

              <div className="h-3 w-1/4 rounded-full bg-blue-500"></div>

            </div>

            <p className="mt-3 text-yellow-400">
              Initializing
            </p>

          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="text-xl font-bold">
              Quick Actions
            </h2>

            <Link
              href="/rooms"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 hover:bg-blue-500"
            >
              + Add Room
            </Link>

          </div>

        </div>

      </div>
    </main>
  );
}