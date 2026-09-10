'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/lib/toast/ToastContext';
import {
  createTechnicianAction,
  listTechniciansAction,
  deleteTechnicianAction,
  type TechnicianInfo,
} from '@/actions/technicians';
import {
  Users,
  UserPlus,
  Shield,
  Phone,
  Mail,
  CalendarCheck2,
  Trash2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Sparkles,
  Lock,
} from 'lucide-react';

export function TeamManagement() {
  const toast = useToast();
  const [technicians, setTechnicians] = useState<TechnicianInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New technician form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('TechPass2025!');
  const [phone, setPhone] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    pass: string;
    name: string;
  } | null>(null);

  async function loadTechnicians() {
    setLoading(true);
    const res = await listTechniciansAction();
    if (res.success && res.data) {
      setTechnicians(res.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTechnicians();
  }, []);

  async function handleCreateTechnician(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('phone', phone);

    const res = await createTechnicianAction(formData);
    setIsSubmitting(false);

    if (!res.success) {
      toast.error('Creation Failed', res.error || 'Failed to create technician account.');
    } else {
      toast.success('Technician Provisioned', res.message || 'Technician ready to log in.');
      setCreatedCredentials({
        email,
        pass: password,
        name: fullName,
      });
      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setShowAddModal(false);
      loadTechnicians();
    }
  }

  async function handleDelete(memberId: string, name: string) {
    if (!confirm(`Are you sure you want to remove ${name} from your organization?`)) return;
    const res = await deleteTechnicianAction(memberId);
    if (res.success) {
      toast.success('Technician Removed', `${name} has been removed.`);
      loadTechnicians();
    } else {
      toast.error('Error', res.error || 'Failed to remove technician.');
    }
  }

  function handleCopyCredentials(creds: { email: string; pass: string }) {
    navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.pass}\nLogin URL: ${window.location.origin}/login`);
    setCopiedId('creds');
    toast.success('Copied!', 'Technician login credentials copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Created Credentials Banner (shows when a new technician was just created) */}
      {createdCredentials && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 shadow-sm">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Technician Account Created for {createdCredentials.name}!
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5">
                  They can immediately sign in on mobile or another tab with these credentials:
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-emerald-500/20">
                  <span><strong>Email:</strong> {createdCredentials.email}</span>
                  <span>•</span>
                  <span><strong>Password:</strong> {createdCredentials.pass}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleCopyCredentials(createdCredentials)}
                className="bg-white/80 dark:bg-zinc-800/80 hover:bg-white text-xs shrink-0"
              >
                {copiedId === 'creds' ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy Credentials
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Technicians List Card */}
      <Card className="glass-panel text-card-foreground">
        <CardHeader className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 dark:border-zinc-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/25">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Field Technicians & Crew
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Create and manage technicians who receive mobile dispatch orders and Swiggy-style navigation.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="shrink-0 font-semibold shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Field Technician
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-zinc-500 animate-pulse">
              Loading field technicians roster...
            </div>
          ) : technicians.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">No field technicians yet</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                Add your field plumbers and technicians so they can log in on their mobile phones, see assigned orders, and navigate to client sites.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="mt-4"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Add Your First Technician
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {technicians.map((tech) => (
                <div
                  key={tech.id}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 hover:bg-white/80 dark:hover:bg-zinc-800/80 transition-all flex flex-col justify-between shadow-2xs group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {tech.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                            {tech.fullName}
                          </h4>
                          <Badge variant="secondary" className="text-[10px] py-0 px-2 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                            Field Tech
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {tech.email}
                          </span>
                          {tech.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {tech.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(tech.id, tech.fullName)}
                      title="Remove Technician"
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-300">
                      <CalendarCheck2 className="w-3.5 h-3.5 text-sky-500" />
                      <span><strong>{tech.activeJobsCount}</strong> Active Jobs Assigned</span>
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Active Member
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Technician Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-600 text-white">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  Provision Field Technician
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTechnician} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Dave Miller"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Technician Login Email *
                </label>
                <Input
                  type="email"
                  required
                  placeholder="e.g. dave.plumber@tradeflow.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Initial Password * (min 6 characters)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="w-3.5 h-3.5 absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Technician will use this password to log in directly from phone or browser.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                  Mobile Phone (for dispatch calls)
                </label>
                <Input
                  type="tel"
                  placeholder="(555) 345-6789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/80 text-[11px] text-sky-800 dark:text-sky-300">
                Technicians get a streamlined Swiggy/Zomato-style delivery UI showing their assigned work orders, turn-by-turn navigation map, and labor stopwatch. They cannot access quotes, invoices, or revenue metrics.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Technician'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
