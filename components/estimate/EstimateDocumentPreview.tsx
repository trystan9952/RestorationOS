"use client";

import type { Estimate } from "@/lib/domain/Estimate";
import type { EstimateArea } from "@/lib/domain/EstimateArea";
import type { EstimateLineItem } from "@/lib/domain/EstimateLineItem";
import { formatQuantitySourceLabel } from "@/lib/domain/EstimateQuantitySource";
import type { Loss } from "@/lib/domain/Loss";
import type { Room } from "@/lib/domain/Room";
import {
  displayField,
  formatEstimateDate,
  formatEstimateNumber,
  formatLossDate,
} from "@/lib/utils/estimateDocument";
import {
  calculateAreaTotal,
  calculateEstimateTotal,
  calculateLineItemTotal,
  formatCurrency,
} from "@/lib/utils/estimateTotals";

const EMPTY_LINE_ITEMS: EstimateLineItem[] = [];

type EstimateDocumentPreviewProps = {
  loss: Loss;
  estimate: Estimate;
  areas: EstimateArea[];
  lineItemsByAreaId: Record<string, EstimateLineItem[]>;
  rooms: Room[];
};

function areaKindLabel(area: EstimateArea, rooms: Room[]): string {
  if (!area.roomId) {
    return "Custom Area";
  }
  const room = rooms.find((entry) => entry.id === area.roomId);
  return room?.name?.trim() || area.name;
}

export function EstimateDocumentPreview({
  loss,
  estimate,
  areas,
  lineItemsByAreaId,
  rooms,
}: EstimateDocumentPreviewProps) {
  const estimateTotal = calculateEstimateTotal(
    areas.map((area) => lineItemsByAreaId[area.id] ?? EMPTY_LINE_ITEMS)
  );
  const notes = estimate.notes?.trim() ?? "";

  return (
    <article
      className="estimate-document mx-auto max-w-4xl bg-white text-slate-900 shadow-xl print:max-w-none print:shadow-none"
      aria-label="Estimate preview"
    >
      <div className="border-b border-slate-300 px-6 py-8 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          RestorationOS
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Estimate
        </h1>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Estimate Status</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {estimate.status}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Estimate Date</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {formatEstimateDate(estimate.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Estimate #</dt>
            <dd className="mt-1 font-medium tabular-nums text-slate-900">
              {formatEstimateNumber(estimate.id)}
            </dd>
          </div>
        </dl>
      </div>

      <section className="border-b border-slate-300 px-6 py-6 sm:px-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Customer / Loss Information
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Customer</dt>
            <dd className="mt-1 font-medium">{displayField(loss.customer)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Address</dt>
            <dd className="mt-1 font-medium">{displayField(loss.address)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Phone</dt>
            <dd className="mt-1 font-medium">{displayField(loss.phone)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Insurance</dt>
            <dd className="mt-1 font-medium">{displayField(loss.insurance)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Claim Number</dt>
            <dd className="mt-1 font-medium">
              {displayField(loss.claimNumber)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Loss Type</dt>
            <dd className="mt-1 font-medium">{displayField(loss.lossType)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Date of Loss</dt>
            <dd className="mt-1 font-medium">
              {loss.dateOfLoss?.trim()
                ? formatLossDate(loss.dateOfLoss)
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="px-6 py-6 sm:px-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Scope
        </h2>

        {areas.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">
            No estimate areas added.
          </p>
        ) : (
          <div className="mt-6 grid gap-8">
            {areas.map((area) => {
              const lineItems =
                lineItemsByAreaId[area.id] ?? EMPTY_LINE_ITEMS;
              const areaTotal = calculateAreaTotal(lineItems);

              return (
                <section
                  key={area.id}
                  className="estimate-area border border-slate-200"
                >
                  <header className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {area.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {area.roomId ? (
                        <>
                          Room:{" "}
                          <span className="font-medium text-slate-800">
                            {areaKindLabel(area, rooms)}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium text-slate-800">
                          Custom Area
                        </span>
                      )}
                    </p>
                  </header>

                  {lineItems.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-slate-600">
                      No line items.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-600">
                            <th className="px-4 py-3 font-semibold">
                              Description
                            </th>
                            <th className="px-4 py-3 font-semibold">
                              Quantity
                            </th>
                            <th className="px-4 py-3 font-semibold">Unit</th>
                            <th className="px-4 py-3 font-semibold">
                              Unit Price
                            </th>
                            <th className="px-4 py-3 text-right font-semibold">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-slate-100 align-top"
                            >
                              <td className="px-4 py-3 font-medium text-slate-900">
                                {item.description}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-slate-900">
                                <div>{item.quantity}</div>
                                <div className="mt-1 text-xs font-normal text-slate-500">
                                  Source:{" "}
                                  {formatQuantitySourceLabel(
                                    item.quantitySource ?? "manual"
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-800">
                                {item.unit}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-slate-800">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                                {formatCurrency(calculateLineItemTotal(item))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-end border-t border-slate-200 px-4 py-3">
                    <p className="text-sm text-slate-700">
                      Area Subtotal:{" "}
                      <span className="font-semibold tabular-nums text-slate-900">
                        {formatCurrency(areaTotal)}
                      </span>
                    </p>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex justify-end border-t border-slate-300 pt-4">
          <p className="text-base font-semibold text-slate-900">
            Estimate Subtotal:{" "}
            <span className="tabular-nums">
              {formatCurrency(estimateTotal)}
            </span>
          </p>
        </div>
      </section>

      {notes ? (
        <section className="border-t border-slate-300 px-6 py-6 sm:px-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Notes
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {notes}
          </p>
        </section>
      ) : null}

      <footer className="border-t border-slate-300 px-6 py-5 text-center text-xs text-slate-500 sm:px-10">
        Prepared by RestorationOS
      </footer>
    </article>
  );
}
