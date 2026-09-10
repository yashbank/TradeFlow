import React from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata = {
  title: 'Set New Password — TradeFlow',
  description: 'Update your TradeFlow account password',
};

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
