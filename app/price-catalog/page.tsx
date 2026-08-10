"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { PriceCatalogWorkspace } from "@/components/price-catalog/PriceCatalogWorkspace";
import { useTwinStore } from "@/lib/store/useTwinStore";

export default function PriceCatalogPage() {
  const loadPriceCatalog = useTwinStore((state) => state.loadPriceCatalog);

  useEffect(() => {
    void loadPriceCatalog();
  }, [loadPriceCatalog]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-6 inline-block text-blue-400 hover:text-blue-300"
        >
          ← Jobs
        </Link>

        <Header
          title="Price Catalog"
          subtitle="Company pricing library for estimates"
        />

        <div className="mt-6">
          <PriceCatalogWorkspace />
        </div>
      </div>
    </main>
  );
}
