"use client";

import type { EstimateDocumentData } from "@/lib/utils/estimateDocument";
import { displayField } from "@/lib/utils/estimateDocument";
import { formatCurrency } from "@/lib/utils/estimateTotals";

type EstimateDocumentPreviewProps = {
  document: EstimateDocumentData;
};

export function EstimateDocumentPreview({
  document,
}: EstimateDocumentPreviewProps) {
  const { company, estimate, loss, areas, totals } = document;
  const notes = estimate.notes?.trim() ?? "";
  const showLogo = Boolean(company.logoUrl?.trim());

  return (
    <article
      className="estimate-document mx-auto max-w-4xl bg-white text-slate-900 shadow-xl print:max-w-none print:shadow-none"
      aria-label="Estimate preview"
    >
      <div className="border-b border-slate-300 px-6 py-8 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {showLogo ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Supabase logo URL
            <img
              src={company.logoUrl!}
              alt={`${company.name} logo`}
              className="h-16 w-16 object-contain"
            />
          ) : null}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              {company.name}
            </p>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              {company.phone ? <p>{company.phone}</p> : null}
              {company.email ? <p>{company.email}</p> : null}
              {company.website ? <p>{company.website}</p> : null}
              {company.address ? <p>{company.address}</p> : null}
            </div>
          </div>
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
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
            <dd className="mt-1 font-medium text-slate-900">{estimate.date}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Estimate #</dt>
            <dd className="mt-1 font-medium tabular-nums text-slate-900">
              {estimate.estimateNumber}
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
            <dd className="mt-1 font-medium">{displayField(loss.dateOfLoss)}</dd>
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
            {areas.map((area) => (
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
                          {area.roomLabel}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium text-slate-800">
                        Custom Area
                      </span>
                    )}
                  </p>
                </header>

                {area.lineItems.length === 0 ? (
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
                          <th className="px-4 py-3 font-semibold">Quantity</th>
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
                        {area.lineItems.map((item) => (
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
                                Source: {item.quantitySourceLabel}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-800">
                              {item.unit}
                            </td>
                            <td className="px-4 py-3 tabular-nums text-slate-800">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-900">
                              {formatCurrency(item.total)}
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
                      {formatCurrency(area.subtotal)}
                    </span>
                  </p>
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-end border-t border-slate-300 pt-4">
          <p className="text-base font-semibold text-slate-900">
            Estimate Subtotal:{" "}
            <span className="tabular-nums">
              {formatCurrency(totals.subtotal)}
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
