"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { PriceBookImportWorkspace } from "@/components/price-catalog/PriceBookImportWorkspace";
import { useTwinStore } from "@/lib/store/useTwinStore";

export default function PriceCatalogImportPage() {
  const loadPriceCatalog = useTwinStore((state) => state.loadPriceCatalog);

  useEffect(() => {
    void loadPriceCatalog();
  }, [loadPriceCatalog]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/price-catalog"
          className="mb-6 inline-block text-blue-400 hover:text-blue-300"
        >
          ← Price Catalog
        </Link>

        <Header
          title="Import Price Book"
          subtitle="Load company pricing from a normalized CSV"
        />

        <div className="mt-6">
          <PriceBookImportWorkspace />
        </div>
      </div>
    </main>
  );
}
