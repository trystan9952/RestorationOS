"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

const CATALOG_UNITS = [
  "SF",
  "LF",
  "EA",
  "HR",
  "DAY",
  "LS",
  "PAIR",
  "SAMPLE",
] as const;

type CatalogFormState = {
  category: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  unitPrice: string;
  active: boolean;
};

function emptyForm(): CatalogFormState {
  return {
    category: "",
    code: "",
    name: "",
    description: "",
    unit: "SF",
    unitPrice: "0",
    active: true,
  };
}

function formFromItem(item: PriceCatalogItem): CatalogFormState {
  return {
    category: item.category,
    code: item.code ?? "",
    name: item.name,
    description: item.description ?? "",
    unit: item.unit,
    unitPrice: String(item.unitPrice),
    active: item.active,
  };
}

export function PriceCatalogWorkspace() {
  const items = useTwinStore((state) => state.priceCatalogItems);
  const priceCatalogStatus = useTwinStore((state) => state.priceCatalogStatus);
  const priceCatalogError = useTwinStore((state) => state.priceCatalogError);
  const isSavingPriceCatalog = useTwinStore(
    (state) => state.isSavingPriceCatalog
  );
  const createPriceCatalogItem = useTwinStore(
    (state) => state.createPriceCatalogItem
  );
  const updatePriceCatalogItem = useTwinStore(
    (state) => state.updatePriceCatalogItem
  );
  const setPriceCatalogItemActive = useTwinStore(
    (state) => state.setPriceCatalogItemActive
  );
  const clearPriceCatalogError = useTwinStore(
    (state) => state.clearPriceCatalogError
  );

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceCatalogItem | null>(null);
  const [form, setForm] = useState<CatalogFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const categories = useMemo(() => {
    return [...new Set(items.map((item) => item.category))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      if (!showInactive && !item.active) {
        return false;
      }
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }
      if (!query) {
        return true;
      }

      const haystack = [
        item.code ?? "",
        item.name,
        item.description ?? "",
        item.category,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [categoryFilter, items, search, showInactive]);

  const grouped = useMemo(() => {
    const map = new Map<string, PriceCatalogItem[]>();
    for (const item of filteredItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  function openCreate() {
    clearPriceCatalogError();
    setFormError(null);
    setEditingItem(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  }

  function openEdit(item: PriceCatalogItem) {
    clearPriceCatalogError();
    setFormError(null);
    setEditingItem(item);
    setForm(formFromItem(item));
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingItem(null);
    setForm(emptyForm());
    setFormError(null);
  }

  async function handleSave() {
    if (isSavingPriceCatalog) {
      return;
    }

    const category = form.category.trim();
    const code = form.code.trim();
    const name = form.name.trim();
    const unit = form.unit.trim();
    const description = form.description.trim();
    const unitPrice = Number(form.unitPrice);

    if (!category || !name || !unit) {
      setFormError("Category, name, and unit are required.");
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setFormError("Unit price must be a number greater than or equal to 0.");
      return;
    }

    setFormError(null);
    clearPriceCatalogError();

    try {
      if (editingItem) {
        await updatePriceCatalogItem(editingItem.id, {
          category,
          code: code || null,
          name,
          description: description || null,
          unit,
          unitPrice,
          active: form.active,
        });
      } else {
        await createPriceCatalogItem({
          category,
          code: code || null,
          name,
          description: description || null,
          unit,
          unitPrice,
          active: form.active,
        });
      }
      closeForm();
    } catch {
      // priceCatalogError is set in the store
    }
  }

  async function handleToggleActive(item: PriceCatalogItem) {
    if (isSavingPriceCatalog) {
      return;
    }

    clearPriceCatalogError();

    try {
      await setPriceCatalogItemActive(item.id, !item.active);
    } catch {
      // priceCatalogError is set in the store
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Price Catalog</h2>
            <p className="mt-1 text-sm text-slate-400">
              Company-owned reusable estimating items. Estimate line items
              snapshot prices when selected.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/price-catalog/import"
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm font-medium hover:bg-slate-800"
            >
              Import Price Book
            </Link>
            <button
              type="button"
              onClick={openCreate}
              disabled={isSavingPriceCatalog}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
            >
              + Add Item
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="code, drywall, category..."
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
          <label className="flex items-end gap-2 pb-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
              className="rounded border-slate-600"
            />
            Show inactive
          </label>
        </div>

        {priceCatalogError ? (
          <p className="mt-4 rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {priceCatalogError}
          </p>
        ) : null}

        {priceCatalogStatus === "loading" ? (
          <p className="mt-6 text-slate-400">Loading catalog...</p>
        ) : null}

        {priceCatalogStatus !== "loading" && grouped.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-700 px-4 py-10 text-center">
            <p className="text-slate-400">No catalog items yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Add your company pricing items to use them in estimates.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
            >
              + Add Item
            </button>
          </div>
        ) : null}

        <div className="mt-6 grid gap-6">
          {grouped.map(([category, categoryItems]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-blue-300">
                {category}
              </h3>

              <div className="mt-3 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Code</th>
                      <th className="py-2 pr-3 font-medium">Name</th>
                      <th className="py-2 pr-3 font-medium">Unit</th>
                      <th className="py-2 pr-3 font-medium">Unit Price</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-800/80"
                      >
                        <td className="py-3 pr-3 font-mono text-xs text-slate-400">
                          {item.code || "—"}
                        </td>
                        <td className="py-3 pr-3">
                          <p className="text-slate-100">{item.name}</p>
                          {item.description &&
                          item.description !== item.name ? (
                            <p className="mt-1 text-xs text-slate-500">
                              {item.description}
                            </p>
                          ) : null}
                        </td>
                        <td className="py-3 pr-3">{item.unit}</td>
                        <td className="py-3 pr-3 tabular-nums">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={
                              item.active
                                ? "text-emerald-400"
                                : "text-slate-500"
                            }
                          >
                            {item.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              disabled={isSavingPriceCatalog}
                              className="text-blue-400 hover:text-blue-300 disabled:opacity-60"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleToggleActive(item)}
                              disabled={isSavingPriceCatalog}
                              className="text-slate-300 hover:text-white disabled:opacity-60"
                            >
                              {item.active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 grid gap-3 md:hidden">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
                  >
                    {item.code ? (
                      <p className="font-mono text-xs text-slate-500">
                        {item.code}
                      </p>
                    ) : null}
                    <p className="font-medium text-slate-100">{item.name}</p>
                    {item.description && item.description !== item.name ? (
                      <p className="mt-1 text-sm text-slate-500">
                        {item.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-slate-300">
                      {item.unit} · {formatCurrency(item.unitPrice)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.active ? "Active" : "Inactive"}
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        disabled={isSavingPriceCatalog}
                        className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(item)}
                        disabled={isSavingPriceCatalog}
                        className="text-sm text-slate-300 hover:text-white disabled:opacity-60"
                      >
                        {item.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeForm();
          }
        }}
      >
        <DialogContent className="border-slate-700 bg-slate-900 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Catalog Item" : "Add Catalog Item"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Catalog prices are snapped into estimate line items when selected.
              Editing a catalog price does not change existing estimates.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">Category</span>
              <input
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                placeholder="Demolition"
                list="price-catalog-categories"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
              />
              <datalist id="price-catalog-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">
                Code{" "}
                <span className="font-normal text-slate-500">(optional)</span>
              </span>
              <input
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
                placeholder="WTRINS"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono outline-none focus:border-blue-500"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">Name</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Remove drywall"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-300">Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={2}
                placeholder="Optional supporting notes"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Unit</span>
                <select
                  value={form.unit}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      unit: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
                >
                  {CATALOG_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                  {!CATALOG_UNITS.includes(
                    form.unit as (typeof CATALOG_UNITS)[number]
                  ) && form.unit ? (
                    <option value={form.unit}>{form.unit}</option>
                  ) : null}
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-300">Unit Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      unitPrice: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
                className="rounded border-slate-600"
              />
              Active
            </label>
          </div>

          {formError ? (
            <p className="text-sm text-red-300">{formError}</p>
          ) : null}
          {priceCatalogError ? (
            <p className="text-sm text-red-300">{priceCatalogError}</p>
          ) : null}

          <DialogFooter>
            <DialogClose
              disabled={isSavingPriceCatalog}
              render={<Button variant="outline" />}
            >
              Cancel
            </DialogClose>
            <Button
              onClick={() => void handleSave()}
              disabled={isSavingPriceCatalog}
            >
              {isSavingPriceCatalog ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
