'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { updateOrganizationAction } from '@/actions/organization';
import { createCheckoutSessionAction, createPortalSessionAction } from '@/actions/billing';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Save, Check } from 'lucide-react';
import { TeamManagement } from '@/components/team/TeamManagement';
import type { Organization, Subscription } from '@/types/database';

interface SettingsFormProps {
  organization: Organization;
  subscription: Subscription | null;
}

export function SettingsForm({ organization, subscription }: SettingsFormProps) {
  const [name, setName] = useState(organization.name);
  const [phone, setPhone] = useState(organization.phone || '');
  const [email, setEmail] = useState(organization.email || '');
  const [addressLine1, setAddressLine1] = useState(organization.address_line1 || '');
  const [city, setCity] = useState(organization.city || '');
  const [state, setState] = useState(organization.state || '');
  const [postalCode, setPostalCode] = useState(organization.postal_code || '');
  const [currency, setCurrency] = useState(organization.currency);
  const [taxRatePercent, setTaxRatePercent] = useState(
    (organization.tax_rate_basis_points / 100).toString()
  );
  const [invoiceTerms, setInvoiceTerms] = useState(
    organization.invoice_terms || 'Payment due within 14 days of receipt.'
  );

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setError(null);

    const taxBasisPoints = Math.round(parseFloat(taxRatePercent || '0') * 100);

    const res = await updateOrganizationAction({
      name,
      country: organization.country,
      timezone: organization.timezone,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address_line1: addressLine1.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      postal_code: postalCode.trim() || null,
      currency,
      tax_rate_basis_points: taxBasisPoints,
      invoice_terms: invoiceTerms.trim() || null,
    });

    setSaving(false);
    if (!res.success) {
      setError(res.error || 'Failed to update settings');
    } else {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  }

  const isTrial = !subscription || subscription.status === 'trialing';
  const isActive = subscription?.status === 'active';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* SaaS Subscription Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <CardHeader className="p-6 pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">TradeFlow SaaS Subscription</CardTitle>
              <p className="text-xs text-slate-500">Starter Plan — $39/month for unlimited quotes, jobs, and invoices</p>
            </div>
          </div>
          <Badge variant={isActive ? 'success' : 'default'} className="uppercase">
            {subscription?.status || 'trialing'}
          </Badge>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {isTrial ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                You are currently on your <strong>14-Day Free Access Trial</strong>. Upgrade to the Starter Plan to ensure continuous access to invoicing and quote conversions.
              </p>
              <form action={createCheckoutSessionAction}>
                <Button type="submit" size="sm" className="font-semibold shadow-sm">
                  Upgrade to Starter ($39/mo)
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Your subscription is active. You can manage your payment methods, download VAT/tax receipts, or cancel your plan through the Stripe Customer Portal.
              </p>
              <form action={createPortalSessionAction}>
                <Button type="submit" variant="outline" size="sm">
                  Manage Billing via Stripe
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Profile Settings */}
      <Card>
        <CardHeader className="p-6 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">Plumbing Business Profile</CardTitle>
          <p className="text-xs text-slate-500">
            This information appears on quotes, invoices, and the customer portal.
          </p>
        </CardHeader>

        <form onSubmit={handleSaveSettings}>
          <CardContent className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                {error}
              </div>
            )}
            {savedSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-200 flex items-center">
                <Check className="w-4 h-4 mr-1.5" />
                Settings updated successfully!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Business Name *
                </label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Office Phone
                </label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Business Email
                </label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full h-11 rounded-md border border-slate-300 bg-white px-3 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Office / Shop Address
              </label>
              <Input
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="100 Main Street"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">City</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">State</label>
                <Input value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Zip / Postal</label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Sales Tax Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(e.target.value)}
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Example: 8.25 for 8.25% sales tax
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Payment Terms
                </label>
                <Input
                  value={invoiceTerms}
                  onChange={(e) => setInvoiceTerms(e.target.value)}
                  placeholder="Payment due upon completion of service."
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0 flex justify-end border-t border-slate-100">
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Field Technicians & Crew Management */}
      <TeamManagement />
    </div>
  );
}
