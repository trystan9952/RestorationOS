import Link from "next/link";
import Header from "../../components/header";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-6xl">

        <Header
          title="Digital Twin"
          subtitle="Welcome to RestorationOS"
        />

        <div className="mt-8 grid gap-6 md:grid-cols-3">

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Building</h2>
            <p className="mt-4 text-slate-400">
              No address yet
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Rooms</h2>

            <Link
              href="/rooms"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 hover:bg-blue-500"
            >
              Manage Rooms
            </Link>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold">Twin Status</h2>

            <p className="mt-4 text-yellow-400">
              Initializing
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}