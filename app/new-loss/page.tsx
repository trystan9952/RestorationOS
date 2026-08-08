import Header from "../../components/header";
import Input from "../../components/input";
import Button from "../../components/button";

export default function NewLossPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
      <div className="mx-auto max-w-3xl">

        <Header
          title="New Loss"
          subtitle="Every Digital Twin starts with a building."
        />

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

          <Input
            label="Property Address"
            placeholder="123 Main Street"
          />

          <Input
            label="Customer Name"
            placeholder="John Smith"
          />

          <Input
            label="Phone Number"
            placeholder="(555) 555-5555"
          />

          <Input
            label="Insurance Company"
            placeholder="State Farm"
          />

          <Input
            label="Claim Number"
            placeholder="123456789"
          />

          <div className="mt-8">
          <Button
    text="Continue"
    href="/dashboard"
/>
          </div>

        </div>

      </div>
    </main>
  );
}