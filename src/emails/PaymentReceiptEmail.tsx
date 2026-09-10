import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from '@react-email/components';

interface PaymentReceiptEmailProps {
  customerName: string;
  businessName: string;
  invoiceNumber: string;
  amountPaidFormatted: string;
  balanceDueFormatted: string;
  paymentMethod: string;
  referenceNumber?: string | null;
}

export function PaymentReceiptEmail({
  customerName = 'Valued Customer',
  businessName = 'TradeFlow Plumbing',
  invoiceNumber = 'INV-2026-0001',
  amountPaidFormatted = '$1,986.39',
  balanceDueFormatted = '$0.00',
  paymentMethod = 'Credit Card',
  referenceNumber = 'TXN-991823',
}: PaymentReceiptEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Payment Receipt</Heading>
            <Text style={subtitle}>{businessName}</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Dear {customerName},</Text>
            <Text style={paragraph}>
              This confirms that we have successfully received and recorded your payment for invoice{' '}
              <strong>{invoiceNumber}</strong>.
            </Text>

            <Section style={receiptCard}>
              <div style={receiptRow}>
                <span style={receiptLabel}>Amount Received:</span>
                <span style={receiptValueBold}>{amountPaidFormatted}</span>
              </div>
              <div style={receiptRow}>
                <span style={receiptLabel}>Payment Method:</span>
                <span style={receiptValue}>{paymentMethod.replace('_', ' ').toUpperCase()}</span>
              </div>
              {referenceNumber && (
                <div style={receiptRow}>
                  <span style={receiptLabel}>Reference #:</span>
                  <span style={receiptValue}>{referenceNumber}</span>
                </div>
              )}
              <div style={receiptRowLast}>
                <span style={receiptLabel}>Remaining Balance:</span>
                <span style={receiptBalance}>{balanceDueFormatted}</span>
              </div>
            </Section>

            <Text style={paragraph}>
              Thank you for choosing <strong>{businessName}</strong>. Please retain this email for
              your financial records.
            </Text>

            <Hr style={divider} />

            <Text style={footnote}>
              TradeFlow — The 90-Second Quote-to-Invoice App for Plumbers.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PaymentReceiptEmail;

const main: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  padding: '40px 0',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '580px',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e2e8f0',
};

const header: React.CSSProperties = {
  backgroundColor: '#059669',
  padding: '28px',
  textAlign: 'center',
};

const headerTitle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '800',
  margin: '0',
};

const subtitle: React.CSSProperties = {
  color: '#a7f3d0',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginTop: '4px',
  marginBottom: '0',
};

const content: React.CSSProperties = {
  padding: '32px 28px',
};

const greeting: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#0f172a',
  marginBottom: '16px',
};

const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#334155',
  marginBottom: '20px',
};

const receiptCard: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '16px 20px',
  marginBottom: '24px',
};

const receiptRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid #e2e8f0',
  fontSize: '14px',
};

const receiptRowLast: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0 0',
  fontSize: '14px',
  fontWeight: 'bold',
};

const receiptLabel: React.CSSProperties = {
  color: '#64748b',
};

const receiptValue: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: '600',
};

const receiptValueBold: React.CSSProperties = {
  color: '#047857',
  fontWeight: '800',
  fontSize: '16px',
};

const receiptBalance: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '15px',
};

const divider: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
};

const footnote: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  textAlign: 'center',
};
