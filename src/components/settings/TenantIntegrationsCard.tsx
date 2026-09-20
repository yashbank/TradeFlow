'use client';

// ==============================================================================
// src/components/settings/TenantIntegrationsCard.tsx
// Luxury BYOK Integrations Card (OpenAI, Resend, Stripe, Google Places, Trade Presets)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Mail,
  CreditCard,
  MapPin,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Flame,
  Zap,
  Home,
  Save,
  Loader2,
  Radio,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/toast/ToastContext';
import {
  getTenantIntegrationsAction,
  updateTenantIntegrationsAction,
  testOpenAiKeyAction,
  testResendKeyAction,
} from '@/actions/integrations';
import {
  type PrimaryTrade,
  TRADE_PRESETS_CONFIG,
} from '@/types/trades';

export function TenantIntegrationsCard() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingOpenAi, setTestingOpenAi] = useState(false);
  const [testingResend, setTestingResend] = useState(false);

  // Form states
  const [primaryTrade, setPrimaryTrade] = useState<PrimaryTrade>('plumbing');
  const [openaiKey, setOpenaiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [openaiStatus, setOpenaiStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const [resendKey, setResendKey] = useState('');
  const [showResendKey, setShowResendKey] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [resendFromEmail, setResendFromEmail] = useState('');

  const [stripePubKey, setStripePubKey] = useState('');
  const [stripeSecKey, setStripeSecKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getTenantIntegrationsAction();
      if (res.success && res.data) {
        setPrimaryTrade(res.data.primaryTrade || 'plumbing');
        setOpenaiKey(res.data.openaiApiKey || '');
        setResendKey(res.data.resendApiKey || '');
        setResendFromEmail(res.data.resendFromEmail || '');
        setStripePubKey(res.data.stripePublishableKey || '');
        setStripeSecKey(res.data.stripeSecretKey || '');
        setGoogleKey(res.data.googlePlacesApiKey || '');
        setAiEnabled(res.data.aiFeaturesEnabled ?? true);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleTestOpenAi() {
    if (!openaiKey.trim()) {
      toast.error('Missing Key', 'Enter an OpenAI API key starting with "sk-" to test.');
      return;
    }
    setTestingOpenAi(true);
    const res = await testOpenAiKeyAction(openaiKey);
    setTestingOpenAi(false);
    if (res.valid) {
      setOpenaiStatus('valid');
      toast.success('OpenAI Connected', 'Valid API key verified with model endpoint.');
    } else {
      setOpenaiStatus('invalid');
      toast.error('Connection Failed', res.error || 'OpenAI verification failed.');
    }
  }

  async function handleTestResend() {
    if (!resendKey.trim()) {
      toast.error('Missing Key', 'Enter a Resend API key starting with "re_" to test.');
      return;
    }
    setTestingResend(true);
    const res = await testResendKeyAction(resendKey);
    setTestingResend(false);
    if (res.valid) {
      setResendStatus('valid');
      toast.success('Resend Connected', 'Valid API key verified with email service.');
    } else {
      setResendStatus('invalid');
      toast.error('Connection Failed', res.error || 'Resend verification failed.');
    }
  }

  async function handleSave() {
    setSaving(true);
    const res = await updateTenantIntegrationsAction({
      primaryTrade,
      openaiApiKey: openaiKey.trim() || null,
      resendApiKey: resendKey.trim() || null,
      resendFromEmail: resendFromEmail.trim() || null,
      stripePublishableKey: stripePubKey.trim() || null,
      stripeSecretKey: stripeSecKey.trim() || null,
      googlePlacesApiKey: googleKey.trim() || null,
      aiFeaturesEnabled: aiEnabled,
    });
    setSaving(false);

    if (res.success) {
      window.dispatchEvent(
        new CustomEvent('tradeflow_preset_updated', {
          detail: { trade: primaryTrade },
        })
      );
      toast.success('Integrations Saved', 'Custom client credentials and trade presets updated.');
      router.refresh();
    } else {
      toast.error('Save Failed', res.error || 'Failed to save integrations.');
    }
  }

  const tradeOptions: Array<{ id: PrimaryTrade; title: string; icon: any; color: string }> = [
    { id: 'plumbing', title: 'Plumbing & Drainage', icon: Wrench, color: 'text-sky-500' },
    { id: 'hvac', title: 'HVAC & Climate', icon: Flame, color: 'text-amber-500' },
    { id: 'electrical', title: 'Electrical & EV', icon: Zap, color: 'text-yellow-500' },
    { id: 'roofing', title: 'Roofing Systems', icon: Home, color: 'text-indigo-500' },
    { id: 'general', title: 'General Contracting', icon: Radio, color: 'text-emerald-500' },
  ];

  if (loading) {
    return (
      <Card className="glass-panel">
        <CardContent className="p-8 flex items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
          <span>Loading client integration settings...</span>
        </CardContent>
      </Card>
    );
  }

  const currentTradeConfig = TRADE_PRESETS_CONFIG[primaryTrade];

  return (
    <Card className="glass-panel border-sky-500/20 shadow-xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-zinc-800/80 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2.5 text-slate-900 dark:text-zinc-100">
              <Sparkles className="w-5 h-5 text-sky-500" />
              Client Customization & BYOK Integrations
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Configure independent API credentials and trade presets for this client workspace.
            </p>
          </div>
          <Badge className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-xs px-3 py-1 font-semibold self-start sm:self-auto">
            Client Isolated
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* 1. Primary Trade Preset Selector */}
        <div>
          <label className="block text-sm font-bold text-slate-900 dark:text-zinc-100 mb-2">
            Primary Trade Industry Preset
          </label>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
            Customizes invoice quick-fill items, quote warranties, and dispatch triage terminology.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {tradeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = primaryTrade === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={async () => {
                    setPrimaryTrade(opt.id);
                    window.dispatchEvent(
                      new CustomEvent('tradeflow_preset_updated', {
                        detail: { trade: opt.id },
                      })
                    );
                    try {
                      const res = await updateTenantIntegrationsAction({
                        primaryTrade: opt.id,
                        openaiApiKey: openaiKey.trim() || null,
                        resendApiKey: resendKey.trim() || null,
                        resendFromEmail: resendFromEmail.trim() || null,
                        stripePublishableKey: stripePubKey.trim() || null,
                        stripeSecretKey: stripeSecKey.trim() || null,
                        googlePlacesApiKey: googleKey.trim() || null,
                        aiFeaturesEnabled: aiEnabled,
                      });
                      if (res.success) {
                        toast.success(
                          'Preset Switched',
                          `Workspace primary trade updated to ${TRADE_PRESETS_CONFIG[opt.id].title}.`
                        );
                        router.refresh();
                      } else {
                        toast.error('Save Failed', res.error || 'Failed to update preset.');
                      }
                    } catch (err: any) {
                      toast.error('Save Failed', err.message || 'Failed to update preset.');
                    }
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 select-none cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 shadow-md ring-1 ring-sky-500/50'
                      : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-900/50'
                  }`}
                >
                  <div className={`p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-xs ${opt.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                      {opt.title}
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {TRADE_PRESETS_CONFIG[opt.id].badge}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 flex items-center justify-between">
            <span>
              Active Preset: <strong className="text-slate-900 dark:text-zinc-200">{currentTradeConfig.title}</strong> ({currentTradeConfig.invoicePresets.length} pre-built service lines)
            </span>
          </div>
        </div>

        {/* 2. OpenAI API Integration */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              OpenAI API Key (Client AI Estimator & Scoping)
            </label>
            {openaiStatus === 'valid' && (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                Connected & Verified
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
            Allows this client to use AI for drafting quotes, breaking down scopes, and auto-filling invoice lines. Falls back to platform default if empty.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Input
                type={showOpenaiKey ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => {
                  setOpenaiKey(e.target.value);
                  setOpenaiStatus('idle');
                }}
                placeholder="sk-proj-..."
                className="pr-10 font-mono text-xs rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestOpenAi}
              disabled={testingOpenAi || !openaiKey.trim()}
              className="text-xs rounded-xl h-10 px-4 shrink-0"
            >
              {testingOpenAi ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Test Connection
            </Button>
          </div>
        </div>

        {/* 3. Resend Transactional Email Key & Sender Address */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-500" />
              Resend API Key & Custom Sender Email
            </label>
            {resendStatus === 'valid' && (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                Connected & Verified
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
            Sends customer proposals and invoices from this client&apos;s verified domain instead of the default platform address.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            <div className="relative">
              <Input
                type={showResendKey ? 'text' : 'password'}
                value={resendKey}
                onChange={(e) => {
                  setResendKey(e.target.value);
                  setResendStatus('idle');
                }}
                placeholder="re_..."
                className="pr-10 font-mono text-xs rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowResendKey(!showResendKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showResendKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              type="text"
              value={resendFromEmail}
              onChange={(e) => setResendFromEmail(e.target.value)}
              placeholder="e.g. Apex Plumbing <quotes@apexplumbing.com>"
              className="text-xs rounded-xl"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestResend}
            disabled={testingResend || !resendKey.trim()}
            className="text-xs rounded-xl h-9 px-4 mt-1"
          >
            {testingResend ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Test Resend Key
          </Button>
        </div>

        {/* 4. Optional Custom Stripe & Google Keys */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          <label className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            Custom Stripe & Google Places Keys (Optional)
          </label>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
            If this tenant has their own Stripe merchant account or Google Places API quota. Leave empty to use platform defaults.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Stripe Publishable Key</span>
              <Input
                type="text"
                value={stripePubKey}
                onChange={(e) => setStripePubKey(e.target.value)}
                placeholder="pk_live_..."
                className="font-mono text-xs rounded-xl"
              />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Google Places API Key</span>
              <Input
                type="password"
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
                placeholder="AIzaSy..."
                className="font-mono text-xs rounded-xl"
              />
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-slate-50 dark:bg-zinc-900/50 p-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Changes take effect immediately across all customer quotes and invoices.
        </span>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl h-10 px-6 shadow-md shadow-sky-500/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Client Settings
        </Button>
      </CardFooter>
    </Card>
  );
}
