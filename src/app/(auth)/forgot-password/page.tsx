import React from 'react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password — TradeFlow',
  description: 'Reset your TradeFlow account password',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
