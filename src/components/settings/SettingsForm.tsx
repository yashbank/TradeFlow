'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { updateOrganizationAction } from '@/actions/organization';
import { createCheckoutSessionAction, createPortalSessionAction } from '@/actions/billing';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Save, Check, User, Camera, Upload, Trash2 } from 'lucide-react';
import { TeamManagement } from '@/components/team/TeamManagement';
import { DataManagementCard } from './DataManagementCard';
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
  const [taxId, setTaxId] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [slogan, setSlogan] = useState('');
  const [operatingHours, setOperatingHours] = useState('Mon-Fri: 7:00 AM - 6:00 PM, 24/7 Emergency');
  const [taxRatePercent, setTaxRatePercent] = useState(
    (organization.tax_rate_basis_points / 100).toString()
  );
  const [invoiceTerms, setInvoiceTerms] = useState(
    organization.invoice_terms || 'Payment due within 14 days of receipt.'
  );

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profileImage, setProfileImage] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tradeflow_user_avatar_url');
    }
    return null;
  });

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Unsupported file type. Please upload a JPG, JPEG, PNG, or WEBP file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setProfileImage(dataUrl);
      try {
        localStorage.setItem('tradeflow_user_avatar_url', dataUrl);
        window.dispatchEvent(new Event('tradeflow_avatar_updated'));
      } catch (err) {
        console.error('Failed to store avatar', err);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveAvatar() {
    setProfileImage(null);
    try {
      localStorage.removeItem('tradeflow_user_avatar_url');
      window.dispatchEvent(new Event('tradeflow_avatar_updated'));
    } catch {}
  }

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
              <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">TradeFlow SaaS Subscription</CardTitle>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Starter Plan — $39/month for unlimited quotes, jobs, and invoices</p>
            </div>
          </div>
          <Badge variant={isActive ? 'success' : 'default'} className="uppercase">
            {subscription?.status || 'trialing'}
          </Badge>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {isTrial ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-zinc-300">
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
              <p className="text-xs text-slate-600 dark:text-zinc-300">
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
        <CardHeader className="p-6 border-b border-slate-100 dark:border-zinc-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">Plumbing Business Profile</CardTitle>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            This information appears on quotes, invoices, and the customer portal.
          </p>
        </CardHeader>

        <form onSubmit={handleSaveSettings}>
          <CardContent className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs rounded-md border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}
            {savedSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs rounded-md border border-emerald-200 dark:border-emerald-900 flex items-center">
                <Check className="w-4 h-4 mr-1.5" />
                Settings updated successfully!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Business Name *
                </label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Business License / Tax ID
                </label>
                <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="e.g. 12-3456789" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Official Website URL
                </label>
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" type="url" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Business Slogan / Tagline
                </label>
                <Input value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Your tagline here" />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Operating Hours
                </label>
                <Input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} placeholder="Mon-Fri: 7:00 AM - 6:00 PM, 24/7 Emergency" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Office Phone
                </label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Business Email
                </label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full h-11 rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 px-3 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                Office / Shop Address
              </label>
              <Input
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="100 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">City</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">State</label>
                <Input value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Zip / Postal</label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
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
                <span className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 block">
                  Example: 8.25 for 8.25% sales tax
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
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

          <CardFooter className="p-6 pt-0 flex justify-end border-t border-slate-100 dark:border-zinc-800">
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* User Profile Avatar & Personal Identity Card */}
      <Card className="glass-panel p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800">
        <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <User className="w-4 h-4 text-sky-500" />
              User Profile & Avatar Icon
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Upload your custom profile photo (supports JPG, JPEG, PNG, WEBP up to 5MB)
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-2 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shadow-md">
              {profileImage ? (
                <img src={profileImage} alt="User Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-slate-400 dark:text-zinc-500" />
              )}
            </div>
            <label
              htmlFor="avatar-upload-input"
              className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity backdrop-blur-xs"
            >
              <Camera className="w-5 h-5 mb-1" />
              Change
            </label>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <input
              id="avatar-upload-input"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('avatar-upload-input')?.click()}
                className="text-xs font-bold"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload Profile Icon
              </Button>
              {profileImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500">
              Your profile icon will appear on dispatch assignments, invoices, customer sign-off portals, and the navigation bar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Field Technicians & Crew Management */}
      <TeamManagement />

      {/* Workspace Data Management & Danger Zone */}
      <DataManagementCard />
    </div>
  );
}
// license, website, operating hours, avatar, tax ID
