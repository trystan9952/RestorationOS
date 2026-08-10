"use client";

import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { CompanySettingsWorkspace } from "@/components/settings/CompanySettingsWorkspace";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-block text-blue-400 hover:text-blue-300"
        >
          ← Jobs
        </Link>

        <Header
          title="Settings"
          subtitle="Company branding for estimates, PDF, and email"
        />

        <div className="mt-6">
          <CompanySettingsWorkspace />
        </div>
      </div>
    </main>
  );
}
