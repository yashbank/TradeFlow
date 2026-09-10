import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice } from '@/types/database';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  businessDetails: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 1.4,
  },
  docTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  docMeta: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 3,
  },
  paidStamp: {
    borderWidth: 2,
    borderColor: '#059669',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  paidStampText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  customerSection: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  customerLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  customerAddress: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 6,
    fontWeight: 'bold',
    color: '#475569',
    fontSize: 8,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 8,
    alignItems: 'center',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  totalsSection: {
    marginLeft: 'auto',
    width: 220,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontSize: 9,
    color: '#475569',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    marginTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: '#0f172a',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 'auto',
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.4,
  },
});

interface InvoicePdfProps {
  invoice: Invoice;
  organization: any;
}

export function InvoicePdfDocument({ invoice, organization }: InvoicePdfProps) {
  const currency = organization?.currency || 'USD';
  const customer = invoice.customer as any;
  const isPaid = invoice.status === 'paid' || invoice.balance_due_cents === 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.businessName}>{organization?.name || 'TradeFlow Plumbing'}</Text>
            {organization?.phone && <Text style={styles.businessDetails}>{organization.phone}</Text>}
            {organization?.email && <Text style={styles.businessDetails}>{organization.email}</Text>}
            {organization?.address_line1 && (
              <Text style={styles.businessDetails}>
                {organization.address_line1}, {organization.city}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.docTitle}>INVOICE</Text>
            <Text style={styles.docMeta}>Invoice #: {invoice.invoice_number}</Text>
            <Text style={styles.docMeta}>Issue Date: {formatDate(invoice.issue_date)}</Text>
            <Text style={styles.docMeta}>Due Date: {formatDate(invoice.due_date)}</Text>
            {isPaid ? (
              <View style={styles.paidStamp}>
                <Text style={styles.paidStampText}>PAID IN FULL</Text>
              </View>
            ) : (
              <Text style={styles.docMeta}>Status: {invoice.status.toUpperCase()}</Text>
            )}
          </View>
        </View>

        {/* Customer Box */}
        {customer && (
          <View style={styles.customerSection}>
            <Text style={styles.customerLabel}>Billed To</Text>
            <Text style={styles.customerName}>
              {customer.first_name} {customer.last_name}
              {customer.company_name ? ` (${customer.company_name})` : ''}
            </Text>
            <Text style={styles.customerAddress}>
              {customer.address_line1}, {customer.city}, {customer.state} {customer.postal_code}
            </Text>
            {customer.phone && <Text style={styles.customerAddress}>Phone: {customer.phone}</Text>}
          </View>
        )}

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Amount</Text>
          </View>

          {(invoice.items || []).map((item: any, idx: number) => (
            <View key={item.id || idx} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price_cents, currency)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.total_cents, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals & Payments */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(invoice.subtotal_cents, currency)}</Text>
          </View>
          {invoice.discount_cents > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text>-{formatCurrency(invoice.discount_cents, currency)}</Text>
            </View>
          )}
          {invoice.tax_cents > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax:</Text>
              <Text>{formatCurrency(invoice.tax_cents, currency)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text>Total Invoiced:</Text>
            <Text>{formatCurrency(invoice.total_cents, currency)}</Text>
          </View>
          {invoice.amount_paid_cents > 0 && (
            <View style={styles.paidRow}>
              <Text>Amount Paid:</Text>
              <Text>-{formatCurrency(invoice.amount_paid_cents, currency)}</Text>
            </View>
          )}
          <View style={styles.balanceRow}>
            <Text>Balance Due:</Text>
            <Text>{formatCurrency(invoice.balance_due_cents, currency)}</Text>
          </View>
        </View>

        {/* Payment Terms & Instructions */}
        <View style={styles.notesSection}>
          {invoice.terms && (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.notesTitle}>Payment Terms & Instructions</Text>
              <Text style={styles.notesText}>{invoice.terms}</Text>
            </View>
          )}
          {invoice.notes && (
            <View>
              <Text style={styles.notesTitle}>Additional Notes</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
