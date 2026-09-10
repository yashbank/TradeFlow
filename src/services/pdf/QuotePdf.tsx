import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Quote } from '@/types/database';

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
    marginBottom: 24,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  docMeta: {
    fontSize: 9,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 4,
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
    marginBottom: 24,
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
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
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

interface QuotePdfProps {
  quote: Quote;
  organization: any;
}

export function QuotePdfDocument({ quote, organization }: QuotePdfProps) {
  const currency = organization?.currency || 'USD';
  const customer = quote.customer as any;

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
            <Text style={styles.docTitle}>QUOTE</Text>
            <Text style={styles.docMeta}>Quote #: {quote.quote_number}</Text>
            <Text style={styles.docMeta}>Date: {formatDate(quote.issue_date)}</Text>
            <Text style={styles.docMeta}>Valid Until: {formatDate(quote.expiry_date)}</Text>
            <Text style={styles.docMeta}>Status: {quote.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Customer Box */}
        {customer && (
          <View style={styles.customerSection}>
            <Text style={styles.customerLabel}>Prepared For</Text>
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

          {(quote.items || []).map((item: any, idx: number) => (
            <View key={item.id || idx} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unit_price_cents, currency)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.total_cents, currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(quote.subtotal_cents, currency)}</Text>
          </View>
          {quote.discount_cents > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text>-{formatCurrency(quote.discount_cents, currency)}</Text>
            </View>
          )}
          {quote.tax_cents > 0 && (
            <View style={styles.totalRow}>
              <Text>Tax:</Text>
              <Text>{formatCurrency(quote.tax_cents, currency)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text>Estimated Total:</Text>
            <Text>{formatCurrency(quote.total_cents, currency)}</Text>
          </View>
        </View>

        {/* Notes & Terms */}
        <View style={styles.notesSection}>
          {quote.notes && (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.notesTitle}>Warranty & Scope Notes</Text>
              <Text style={styles.notesText}>{quote.notes}</Text>
            </View>
          )}
          {quote.terms && (
            <View>
              <Text style={styles.notesTitle}>Terms & Conditions</Text>
              <Text style={styles.notesText}>{quote.terms}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
