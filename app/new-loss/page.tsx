"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/layout/Button";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/layout/Input";
import { LOSS_TYPES, type LossType } from "@/lib/domain/Loss";
import { useTwinStore } from "@/lib/store/useTwinStore";

function todayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

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
  const [lossType, setLossType] = useState<LossType>("Water");
  const [dateOfLoss, setDateOfLoss] = useState(todayDateInputValue);
  const [formError, setFormError] = useState<string | null>(null);

  const isSaving = status === "loading";

  const canContinue = useMemo(() => {
    return (
      address.trim().length > 0 &&
      customer.trim().length > 0 &&
      lossType.trim().length > 0 &&
      dateOfLoss.trim().length > 0
    );
  }, [address, customer, dateOfLoss, lossType]);

  async function handleContinue() {
    if (isSaving) {
      return;
    }

    const trimmedAddress = address.trim();
    const trimmedCustomer = customer.trim();
    const trimmedDate = dateOfLoss.trim();

    if (!trimmedAddress || !trimmedCustomer || !lossType || !trimmedDate) {
      setFormError(
        "Property address, customer name, loss type, and date of loss are required."
      );
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
        lossType,
        dateOfLoss: trimmedDate,
        status: "New",
      });
      router.push("/dashboard");
    } catch {
      // error is set in the store
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-block text-blue-400 hover:text-blue-300"
        >
          ← Jobs
        </Link>

        <Header
          title="New Loss"
          subtitle="Capture the job details to open the dashboard."
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

          <div className="mb-6">
            <label
              htmlFor="loss-type"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Loss Type
            </label>
            <select
              id="loss-type"
              value={lossType}
              onChange={(event) => setLossType(event.target.value as LossType)}
              disabled={isSaving}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
            >
              {LOSS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label
              htmlFor="date-of-loss"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Date of Loss
            </label>
            <input
              id="date-of-loss"
              type="date"
              value={dateOfLoss}
              onChange={(event) => setDateOfLoss(event.target.value)}
              disabled={isSaving}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </div>

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
            {!canContinue && !isSaving ? (
              <p className="mt-3 text-sm text-slate-500">
                Address, customer, loss type, and date of loss are required.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
