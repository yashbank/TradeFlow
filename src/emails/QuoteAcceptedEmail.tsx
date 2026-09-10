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

interface QuoteAcceptedEmailProps {
  customerName: string;
  businessName: string;
  quoteNumber: string;
  totalFormatted: string;
  signerName: string;
  jobConvertUrl: string;
}

export function QuoteAcceptedEmail({
  customerName = 'Sarah Jenkins',
  businessName = 'TradeFlow Plumbing',
  quoteNumber = 'Q-2026-0001',
  totalFormatted = '$1,986.39',
  signerName = 'Sarah Jenkins',
  jobConvertUrl = 'https://app.tradeflow.com/quotes',
}: QuoteAcceptedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>🎉 Quote Approved!</Heading>
            <Text style={subtitle}>{businessName} Notification</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Great news!</Text>
            <Text style={paragraph}>
              Customer <strong>{customerName}</strong> has digitally approved quote{' '}
              <strong>{quoteNumber}</strong>.
            </Text>

            <Section style={highlightBox}>
              <Text style={highlightLabel}>Approved Amount</Text>
              <Text style={highlightAmount}>{totalFormatted}</Text>
              <Text style={signerInfo}>Digitally signed by: {signerName}</Text>
            </Section>

            <Text style={paragraph}>
              You can now convert this approved quote directly into a scheduled job in 1 click
              without re-entering customer details or line items.
            </Text>

            <Section style={buttonContainer}>
              <Button style={primaryButton} href={jobConvertUrl}>
                Convert to Active Job
              </Button>
            </Section>

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

export default QuoteAcceptedEmail;

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
  fontSize: '18px',
  fontWeight: '700',
  color: '#0f172a',
  marginBottom: '12px',
};

const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#334155',
  marginBottom: '20px',
};

const highlightBox: React.CSSProperties = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center',
  marginBottom: '24px',
};

const highlightLabel: React.CSSProperties = {
  color: '#065f46',
  fontSize: '12px',
  textTransform: 'uppercase',
  fontWeight: '700',
  letterSpacing: '0.5px',
  margin: '0 0 4px',
};

const highlightAmount: React.CSSProperties = {
  color: '#047857',
  fontSize: '28px',
  fontWeight: '900',
  margin: '0',
};

const signerInfo: React.CSSProperties = {
  color: '#065f46',
  fontSize: '13px',
  marginTop: '6px',
  marginBottom: '0',
};

const buttonContainer: React.CSSProperties = {
  textAlign: 'center',
  margin: '28px 0',
};

const primaryButton: React.CSSProperties = {
  backgroundColor: '#059669',
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
  color: '#64748b',
  textAlign: 'center',
};
