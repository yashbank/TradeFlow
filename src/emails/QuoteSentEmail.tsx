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

interface QuoteSentEmailProps {
  customerName: string;
  businessName: string;
  quoteNumber: string;
  totalFormatted: string;
  publicUrl: string;
}

export function QuoteSentEmail({
  customerName = 'Valued Customer',
  businessName = 'TradeFlow Plumbing',
  quoteNumber = 'Q-2026-0001',
  totalFormatted = '$1,986.39',
  publicUrl = 'https://app.tradeflow.com/view/quote/sample',
}: QuoteSentEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>{businessName}</Heading>
            <Text style={subtitle}>Official Plumbing Proposal</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Dear {customerName},</Text>
            <Text style={paragraph}>
              Thank you for the opportunity to provide plumbing services. We have prepared quote{' '}
              <strong>{quoteNumber}</strong> for your review.
            </Text>

            <Section style={highlightBox}>
              <Text style={highlightLabel}>Estimated Total</Text>
              <Text style={highlightAmount}>{totalFormatted}</Text>
            </Section>

            <Text style={paragraph}>
              You can review the itemized breakdown, warranty terms, and digitally approve or
              decline the quote directly on your mobile device or computer:
            </Text>

            <Section style={buttonContainer}>
              <Button style={primaryButton} href={publicUrl}>
                Review & Approve Quote
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={footnote}>
              If the button above does not work, copy and paste this link into your browser:
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

export default QuoteSentEmail;

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
  letterSpacing: '-0.5px',
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
