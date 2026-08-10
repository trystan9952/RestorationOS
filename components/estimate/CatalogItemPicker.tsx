"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PriceCatalogItem } from "@/lib/domain/PriceCatalogItem";
import { useTwinStore } from "@/lib/store/useTwinStore";
import { formatCurrency } from "@/lib/utils/estimateTotals";

type CatalogItemPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: PriceCatalogItem) => void;
};

export function CatalogItemPicker({
  open,
  onOpenChange,
  onSelect,
}: CatalogItemPickerProps) {
  const priceCatalogItems = useTwinStore((state) => state.priceCatalogItems);
  const priceCatalogStatus = useTwinStore((state) => state.priceCatalogStatus);
  const priceCatalogError = useTwinStore((state) => state.priceCatalogError);
  const loadPriceCatalog = useTwinStore((state) => state.loadPriceCatalog);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (!open) {
      return;
    }
    void loadPriceCatalog();
  }, [loadPriceCatalog, open]);

  const activeItems = useMemo(
    () => priceCatalogItems.filter((item) => item.active),
    [priceCatalogItems]
  );

  const categories = useMemo(() => {
    return [...new Set(activeItems.map((item) => item.category))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [activeItems]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activeItems.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      if (!query) {
        return true;
      }

      const haystack = [
        item.name,
        item.description ?? "",
        item.category,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [activeItems, categoryFilter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, PriceCatalogItem[]>();
    for (const item of filteredItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-700 bg-slate-900 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add from Catalog</DialogTitle>
          <DialogDescription className="text-slate-400">
            Selecting an item copies description, unit, and unit price into this
            line item. Quantity source is not changed.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="drywall"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Category</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        {priceCatalogError ? (
          <p className="text-sm text-red-300">{priceCatalogError}</p>
        ) : null}

        <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-800">
          {priceCatalogStatus === "loading" ? (
            <p className="p-4 text-sm text-slate-400">Loading catalog...</p>
          ) : null}

          {priceCatalogStatus !== "loading" && grouped.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">
              No active catalog items. Add items in Price Catalog first.
            </p>
          ) : null}

          {grouped.map(([category, categoryItems]) => (
            <div key={category} className="border-b border-slate-800 last:border-b-0">
              <p className="sticky top-0 bg-slate-950/95 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-blue-300">
                {category}
              </p>
              <ul>
                {categoryItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(item);
                        onOpenChange(false);
                      }}
                      className="flex w-full flex-col gap-1 px-3 py-3 text-left hover:bg-slate-800/80"
                    >
                      <span className="font-medium text-slate-100">
                        {item.name}
                      </span>
                      {item.description ? (
                        <span className="text-xs text-slate-500">
                          {item.description}
                        </span>
                      ) : null}
                      <span className="text-sm text-slate-400">
                        {item.unit} · {formatCurrency(item.unitPrice)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
