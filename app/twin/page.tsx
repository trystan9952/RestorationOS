import Header from "../../components/header";

export default function TwinPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">

      <div className="mx-auto max-w-6xl">

        <Header
          title="Digital Twin"
          subtitle="Every piece of information belongs to the building."
        />

        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
            <h2 className="text-xl font-bold">Building</h2>

            <p className="mt-4 text-slate-400">
              123 Main Street
            </p>

            <p className="text-slate-400">
              Columbia, MO
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
            <h2 className="text-xl font-bold">Twin Status</h2>

            <p className="mt-4 text-yellow-400 font-semibold">
              Initializing
            </p>

            <div className="mt-5 h-3 rounded-full bg-slate-700">
              <div className="h-3 w-1/4 rounded-full bg-blue-500"></div>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              25% Complete
            </p>

          </div>

          <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
            <h2 className="text-xl font-bold">Quick Stats</h2>

            <div className="mt-4 space-y-2">

              <p>Rooms: 0</p>

              <p>Photos: 0</p>

              <p>Equipment: 0</p>

              <p>Timeline Events: 1</p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}