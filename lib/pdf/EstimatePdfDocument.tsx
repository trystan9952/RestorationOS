import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { EstimateDocumentData } from "@/lib/utils/estimateDocument";
import { formatCurrency } from "@/lib/utils/estimateTotals";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  headerRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  logo: {
    width: 64,
    height: 64,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  muted: {
    color: "#475569",
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 16,
  },
  metaBlock: {
    flexGrow: 1,
  },
  label: {
    color: "#64748b",
    fontSize: 9,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  value: {
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  gridItem: {
    width: "50%",
    marginBottom: 8,
    paddingRight: 8,
  },
  area: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginBottom: 12,
  },
  areaHeader: {
    backgroundColor: "#f8fafc",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  areaName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colDesc: { width: "36%" },
  colQty: { width: "16%" },
  colUnit: { width: "12%" },
  colPrice: { width: "18%" },
  colTotal: { width: "18%", textAlign: "right" },
  headerCell: {
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    fontSize: 9,
  },
  source: {
    color: "#64748b",
    fontSize: 8,
    marginTop: 2,
  },
  areaSubtotal: {
    padding: 8,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  empty: {
    padding: 10,
    color: "#64748b",
  },
  estimateTotal: {
    marginTop: 8,
    textAlign: "right",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  notes: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
  },
  notesBody: {
    marginTop: 6,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#64748b",
    fontSize: 9,
  },
});

function display(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function isPdfSafeLogoUrl(url: string | null): boolean {
  if (!url) {
    return false;
  }
  const lower = url.toLowerCase();
  if (lower.includes(".svg") || lower.includes("image/svg")) {
    return false;
  }
  return (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("data:image/")
  );
}

type EstimatePdfDocumentProps = {
  document: EstimateDocumentData;
};

export function EstimatePdfDocument({ document }: EstimatePdfDocumentProps) {
  const { company, estimate, loss, areas, totals } = document;
  const showLogo = isPdfSafeLogoUrl(company.logoUrl);

  return (
    <Document
      title={`Estimate ${estimate.estimateNumber}`}
      author={company.name}
      subject="Restoration estimate"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          {showLogo && company.logoUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
            <Image src={company.logoUrl} style={styles.logo} />
          ) : null}
          <View>
            <Text style={styles.companyName}>{company.name}</Text>
            {company.phone ? (
              <Text style={styles.muted}>{company.phone}</Text>
            ) : null}
            {company.email ? (
              <Text style={styles.muted}>{company.email}</Text>
            ) : null}
            {company.website ? (
              <Text style={styles.muted}>{company.website}</Text>
            ) : null}
            {company.address ? (
              <Text style={styles.muted}>{company.address}</Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.title}>Estimate</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Estimate #</Text>
            <Text style={styles.value}>{estimate.estimateNumber}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{estimate.date}</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{estimate.status}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Customer / Loss Information</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Customer</Text>
            <Text>{display(loss.customer)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Address</Text>
            <Text>{display(loss.address)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Phone</Text>
            <Text>{display(loss.phone)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Insurance</Text>
            <Text>{display(loss.insurance)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Claim Number</Text>
            <Text>{display(loss.claimNumber)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Loss Type</Text>
            <Text>{display(loss.lossType)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Date of Loss</Text>
            <Text>{display(loss.dateOfLoss)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Scope</Text>

        {areas.length === 0 ? (
          <Text style={styles.empty}>No estimate areas added.</Text>
        ) : (
          areas.map((area) => (
            <View key={area.id} style={styles.area} wrap={false}>
              <View style={styles.areaHeader}>
                <Text style={styles.areaName}>{area.name}</Text>
                <Text style={styles.muted}>
                  {area.roomId ? `Room: ${area.roomLabel}` : "Custom Area"}
                </Text>
              </View>

              {area.lineItems.length === 0 ? (
                <Text style={styles.empty}>No line items.</Text>
              ) : (
                <>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.colDesc, styles.headerCell]}>
                      Description
                    </Text>
                    <Text style={[styles.colQty, styles.headerCell]}>
                      Quantity
                    </Text>
                    <Text style={[styles.colUnit, styles.headerCell]}>
                      Unit
                    </Text>
                    <Text style={[styles.colPrice, styles.headerCell]}>
                      Unit Price
                    </Text>
                    <Text style={[styles.colTotal, styles.headerCell]}>
                      Total
                    </Text>
                  </View>
                  {area.lineItems.map((item) => (
                    <View key={item.id} style={styles.tableRow}>
                      <Text style={styles.colDesc}>{item.description}</Text>
                      <View style={styles.colQty}>
                        <Text>{item.quantity}</Text>
                        <Text style={styles.source}>
                          Source: {item.quantitySourceLabel}
                        </Text>
                      </View>
                      <Text style={styles.colUnit}>{item.unit}</Text>
                      <Text style={styles.colPrice}>
                        {formatCurrency(item.unitPrice)}
                      </Text>
                      <Text style={styles.colTotal}>
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                  ))}
                </>
              )}

              <Text style={styles.areaSubtotal}>
                Area Subtotal: {formatCurrency(area.subtotal)}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.estimateTotal}>
          Estimate Subtotal: {formatCurrency(totals.subtotal)}
        </Text>

        {estimate.notes ? (
          <View style={styles.notes}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesBody}>{estimate.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          Prepared by RestorationOS
        </Text>
      </Page>
    </Document>
  );
}
