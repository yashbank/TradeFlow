import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
} from '@react-email/components';

interface InvoiceSentEmailProps {
  customerName: string;
  businessName: string;
  invoiceNumber: string;
  totalFormatted: string;
  dueDate: string;
  publicUrl: string;
}

export function InvoiceSentEmail({
  customerName = 'Valued Customer',
  businessName = 'TradeFlow Plumbing',
  invoiceNumber = 'INV-2026-0001',
  totalFormatted = '$1,986.39',
  dueDate = 'Sep 24, 2026',
  publicUrl = 'https://app.tradeflow.com/view/invoice/sample',
}: InvoiceSentEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>{businessName}</Heading>
            <Text style={subtitle}>Invoice {invoiceNumber}</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Dear {customerName},</Text>
            <Text style={paragraph}>
              Thank you for your business. Your invoice <strong>{invoiceNumber}</strong> is now
              ready for payment.
            </Text>

            <Section style={highlightBox}>
              <Text style={highlightLabel}>Amount Due</Text>
              <Text style={highlightAmount}>{totalFormatted}</Text>
              <Text style={dueNotice}>Due Date: {dueDate}</Text>
            </Section>

            <Text style={paragraph}>
              You can view the full line-item invoice, download a printable PDF, and review payment
              instructions below:
            </Text>

            <Section style={buttonContainer}>
              <Button style={primaryButton} href={publicUrl}>
                View Invoice & Pay
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={footnote}>
              Invoice link:
              <br />
              <a href={publicUrl} style={link}>
                {publicUrl}
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default InvoiceSentEmail;

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
  backgroundColor: '#1e3a8a',
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
  color: '#93c5fd',
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

const highlightBox: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center',
  marginBottom: '24px',
};

const highlightLabel: React.CSSProperties = {
  color: '#1e40af',
  fontSize: '12px',
  textTransform: 'uppercase',
  fontWeight: '700',
  letterSpacing: '0.5px',
  margin: '0 0 4px',
};

const highlightAmount: React.CSSProperties = {
  color: '#1e3a8a',
  fontSize: '28px',
  fontWeight: '900',
  margin: '0',
};

const dueNotice: React.CSSProperties = {
  color: '#475569',
  fontSize: '13px',
  fontWeight: '600',
  marginTop: '6px',
  marginBottom: '0',
};

const buttonContainer: React.CSSProperties = {
  textAlign: 'center',
  margin: '28px 0',
};

const primaryButton: React.CSSProperties = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'inline-block',
  padding: '14px 28px',
};

const divider: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
};

const footnote: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#64748b',
};

const link: React.CSSProperties = {
  color: '#2563eb',
  textDecoration: 'underline',
};
