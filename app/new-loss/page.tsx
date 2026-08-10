"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/layout/Button";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/layout/Input";
import { useTwinStore } from "@/lib/store/useTwinStore";

export default function NewLossPage() {
  const router = useRouter();
  const createLossRemote = useTwinStore((state) => state.createLossRemote);
  const status = useTwinStore((state) => state.status);
  const error = useTwinStore((state) => state.error);
  const clearError = useTwinStore((state) => state.clearError);

  const [address, setAddress] = useState("");
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [insurance, setInsurance] = useState("");
  const [claimNumber, setClaimNumber] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isSaving = status === "loading";

  async function handleContinue() {
    const trimmedAddress = address.trim();
    const trimmedCustomer = customer.trim();

    if (!trimmedAddress || !trimmedCustomer) {
      setFormError("Property address and customer name are required.");
      return;
    }

    setFormError(null);
    clearError();

    try {
      await createLossRemote({
        address: trimmedAddress,
        customer: trimmedCustomer,
        phone: phone.trim(),
        insurance: insurance.trim(),
        claimNumber: claimNumber.trim(),
      });
      router.push("/dashboard");
    } catch {
      // error is set in the store
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Header
          title="New Loss"
          subtitle="Every Digital Twin starts with a building."
        />

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <Input
            id="loss-address"
            label="Property Address"
            placeholder="123 Main Street"
            value={address}
            onChange={setAddress}
            disabled={isSaving}
          />
          <Input
            id="loss-customer"
            label="Customer Name"
            placeholder="John Smith"
            value={customer}
            onChange={setCustomer}
            disabled={isSaving}
          />
          <Input
            id="loss-phone"
            label="Phone Number"
            placeholder="(555) 555-5555"
            value={phone}
            onChange={setPhone}
            disabled={isSaving}
          />
          <Input
            id="loss-insurance"
            label="Insurance Company"
            placeholder="State Farm"
            value={insurance}
            onChange={setInsurance}
            disabled={isSaving}
          />
          <Input
            id="loss-claim"
            label="Claim Number"
            placeholder="123456789"
            value={claimNumber}
            onChange={setClaimNumber}
            disabled={isSaving}
          />

          {(formError || error) && (
            <p className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {formError ?? error}
            </p>
          )}

          <div className="mt-8">
            <Button
              text={isSaving ? "Saving..." : "Continue"}
              onClick={() => void handleContinue()}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
