"use client";

import { useEffect, useRef, useState } from "react";

import { useTwinStore } from "@/lib/store/useTwinStore";

export function CompanySettingsWorkspace() {
  const companyProfile = useTwinStore((state) => state.companyProfile);
  const companyProfileStatus = useTwinStore(
    (state) => state.companyProfileStatus
  );
  const companyProfileError = useTwinStore(
    (state) => state.companyProfileError
  );
  const isSavingCompanyProfile = useTwinStore(
    (state) => state.isSavingCompanyProfile
  );
  const isUploadingCompanyLogo = useTwinStore(
    (state) => state.isUploadingCompanyLogo
  );
  const loadCompanyProfile = useTwinStore((state) => state.loadCompanyProfile);
  const saveCompanyProfile = useTwinStore((state) => state.saveCompanyProfile);
  const uploadCompanyLogo = useTwinStore((state) => state.uploadCompanyLogo);
  const deleteCompanyLogo = useTwinStore((state) => state.deleteCompanyLogo);
  const clearCompanyProfileError = useTwinStore(
    (state) => state.clearCompanyProfileError
  );

  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadCompanyProfile().catch(() => {
      // error stored in Zustand
    });
  }, [loadCompanyProfile]);

  useEffect(() => {
    if (!companyProfile) {
      return;
    }
    setCompanyName(companyProfile.companyName);
    setPhone(companyProfile.phone ?? "");
    setEmail(companyProfile.email ?? "");
    setWebsite(companyProfile.website ?? "");
    setAddress(companyProfile.address ?? "");
  }, [companyProfile]);

  const busy = isSavingCompanyProfile || isUploadingCompanyLogo;

  async function handleSave() {
    if (busy) {
      return;
    }

    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setFormError("Company name is required.");
      return;
    }

    setFormError(null);
    setSaveMessage(null);
    clearCompanyProfileError();

    try {
      await saveCompanyProfile({
        companyName: trimmedName,
        phone,
        email,
        website,
        address,
      });
      setSaveMessage("Company settings saved.");
    } catch {
      // companyProfileError is set in the store
    }
  }

  async function handleLogoSelected(file: File | null) {
    if (!file || busy) {
      return;
    }

    setFormError(null);
    setSaveMessage(null);
    clearCompanyProfileError();

    try {
      await uploadCompanyLogo(file);
      setSaveMessage("Logo uploaded.");
    } catch {
      // companyProfileError is set in the store
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveLogo() {
    if (busy || !companyProfile?.logoUrl) {
      return;
    }

    setFormError(null);
    setSaveMessage(null);
    clearCompanyProfileError();

    try {
      await deleteCompanyLogo();
      setSaveMessage("Logo removed.");
    } catch {
      // companyProfileError is set in the store
    }
  }

  if (companyProfileStatus === "loading" && !companyProfile) {
    return <p className="text-slate-400">Loading company settings...</p>;
  }

  return (
    <div className="grid gap-6">
      {companyProfileError ? (
        <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {companyProfileError}
        </p>
      ) : null}
      {formError ? (
        <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {formError}
        </p>
      ) : null}
      {saveMessage ? (
        <p className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
          {saveMessage}
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-2xl font-bold">Company Settings</h2>
        <p className="mt-2 text-sm text-slate-400">
          Branding shown on estimate preview, PDF, and email. Global for this
          MVP.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Company Name</span>
            <input
              type="text"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              disabled={busy}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={busy}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={busy}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Website</span>
            <input
              type="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              disabled={busy}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Address</span>
            <textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              rows={3}
              disabled={busy}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-60"
            />
          </label>

          <div>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
            >
              {isSavingCompanyProfile ? "Saving..." : "Save Company Settings"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-2xl font-bold">Company Logo</h2>
        <p className="mt-2 text-sm text-slate-400">
          JPEG, PNG, WebP, or SVG. Max 5MB. Stored in Supabase Storage.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
            {companyProfile?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companyProfile.logoUrl}
                alt="Company logo preview"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="px-2 text-center text-xs text-slate-500">
                No logo
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              id="company-logo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="sr-only"
              disabled={busy}
              onChange={(event) =>
                void handleLogoSelected(event.target.files?.[0] ?? null)
              }
            />
            <label
              htmlFor="company-logo-upload"
              className={`inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 ${
                busy ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {isUploadingCompanyLogo
                ? "Uploading..."
                : companyProfile?.logoUrl
                  ? "Replace Logo"
                  : "Upload Logo"}
            </label>
            {companyProfile?.logoUrl ? (
              <button
                type="button"
                onClick={() => void handleRemoveLogo()}
                disabled={busy}
                className="rounded-lg border border-red-900/70 px-4 py-2 text-sm text-red-400 hover:bg-red-950/40 disabled:opacity-60"
              >
                Remove Logo
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
