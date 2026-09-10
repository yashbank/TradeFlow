import React from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata = {
  title: 'Set New Password — TradeFlow',
  description: 'Update your TradeFlow account password',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
