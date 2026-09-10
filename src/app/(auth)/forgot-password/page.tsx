import React from 'react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password — TradeFlow',
  description: 'Reset your TradeFlow account password',
};

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
