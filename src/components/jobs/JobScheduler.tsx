'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { createJobAction } from '@/actions/jobs';
import {
  CalendarCheck2,
  MapPin,
  Clock,
  User,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Wrench,
} from 'lucide-react';
import { useToast } from '@/lib/toast/ToastContext';
import type { Customer } from '@/types/database';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface JobSchedulerProps {
  customers: Customer[];
  teamMembers: TeamMember[];
  defaultCustomerId?: string;
}

const PLUMBING_JOB_PRESETS = [
  {
    title: 'Emergency Pipe Leak Repair',
    description: 'Locate and repair active pipe leak, replace damaged copper/PEX section, verify pressure seal.',
  },
  {
    title: 'Main Drain Snaking & Clog Clearance',
    description: 'Heavy-duty motorized snake line cleanout from main access trap. Test full fixture discharge.',
  },
  {
    title: 'Water Heater Diagnostic & Replacement',
    description: 'Inspect gas/electric water heater for burner or element failure, test T&P relief valve, prepare replacement estimate or swap tank.',
  },
  {
    title: 'Faucet & Sink Fixture Installation',
    description: 'Remove old kitchen/lavatory fixture, replace supply lines, install high-flow cartridge faucet, leak-test traps.',
  },
  {
    title: 'Toilet Rebuild & Wax Ring Reseat',
    description: 'Replace faulty flapper/fill valve, pull bowl to replace degraded wax gasket, secure brass closet bolts, water-test seal.',
  },
  {
    title: 'Sewer Line Camera Video Inspection',
    description: 'Fiber-optic camera line run to municipal connection. Record digital footage for root intrusion or bellied piping.',
  },
];

export function JobScheduler({
  customers,
  teamMembers,
  defaultCustomerId,
}: JobSchedulerProps) {
  const router = useRouter();
  const toast = useToast();

  const selectedInitialCustomer = defaultCustomerId
    ? customers.find((c) => c.id === defaultCustomerId) || customers[0]
    : customers[0];

  const [customerId, setCustomerId] = useState(selectedInitialCustomer?.id || '');
  const [title, setTitle] = useState(PLUMBING_JOB_PRESETS[0].title);
  const [description, setDescription] = useState(PLUMBING_JOB_PRESETS[0].description);
  const [assignedToUserId, setAssignedToUserId] = useState(teamMembers[0]?.id || '');

  // Default to tomorrow 09:00 - 11:00 AM local
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const dateStr = tomorrow.toISOString().split('T')[0];
  const [scheduledStart, setScheduledStart] = useState(`${dateStr}T09:00`);
  const [scheduledEnd, setScheduledEnd] = useState(`${dateStr}T11:00`);

  // Service Location Address
  const [addressLine1, setAddressLine1] = useState(selectedInitialCustomer?.address_line1 || '');
  const [addressLine2, setAddressLine2] = useState(selectedInitialCustomer?.address_line2 || '');
  const [city, setCity] = useState(selectedInitialCustomer?.city || '');
  const [state, setState] = useState(selectedInitialCustomer?.state || 'CA');
  const [postalCode, setPostalCode] = useState(selectedInitialCustomer?.postal_code || '');

  const [internalNotes, setInternalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When customer selection changes, prefill address
  function handleCustomerChange(newCustId: string) {
    setCustomerId(newCustId);
    const cust = customers.find((c) => c.id === newCustId);
    if (cust) {
      setAddressLine1(cust.address_line1 || '');
      setAddressLine2(cust.address_line2 || '');
      setCity(cust.city || '');
      setState(cust.state || '');
      setPostalCode(cust.postal_code || '');
    }
  }

  function applyPreset(preset: (typeof PLUMBING_JOB_PRESETS)[0]) {
    setTitle(preset.title);
    setDescription(preset.description);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError('Please select an existing customer or add one first.');
      return;
    }
    if (!title.trim()) {
      setError('Job title is required.');
      return;
    }
    if (!addressLine1.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      setError('Complete service address (street, city, state, postal code) is required for dispatch.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createJobAction({
      customer_id: customerId,
      title: title.trim(),
      description: description.trim() || undefined,
      assigned_to_user_id: assignedToUserId || undefined,
      scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : undefined,
      scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : undefined,
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      postal_code: postalCode.trim(),
      internal_notes: internalNotes.trim() || undefined,
    });

    setLoading(false);

    if (!res.success || !res.data) {
      setError(res.error || 'Failed to schedule job.');
      toast.error('Scheduling Failed', res.error || 'Failed to schedule job.');
    } else {
      toast.success('Job Created', `Job #${res.data.job_number || ''} scheduled successfully`);
      router.push(`/jobs/${res.data.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Back button */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Jobs
        </Link>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Plumbing Service Presets */}
      <Card className="border-blue-100 bg-blue-50/40">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Quick-Fill Plumbing Service Presets</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PLUMBING_JOB_PRESETS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all text-left ${
                  title === preset.title
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                {preset.title}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Details Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <Wrench className="w-5 h-5 text-blue-600" />
            Job & Customer Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer select */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full h-11 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} {c.company_name ? `(${c.company_name})` : ''} - {c.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned Technician */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Assigned Plumber / Technician
              </label>
              <select
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
                className="w-full h-11 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned (Open Dispatch)</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Title */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Job Title / Service Summary <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Emergency Pipe Leak Repair"
              className="min-h-[44px]"
            />
          </div>

          {/* Scope Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Work Scope & Diagnosis Instructions
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail specific tasks, materials needed, access codes, or diagnostic history..."
              className="w-full p-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule & Dispatch Timing */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <Clock className="w-5 h-5 text-blue-600" />
            Schedule & Dispatch Timing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Scheduled Arrival Time
              </label>
              <Input
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Estimated Completion Time
              </label>
              <Input
                type="datetime-local"
                value={scheduledEnd}
                onChange={(e) => setScheduledEnd(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Job Location */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <MapPin className="w-5 h-5 text-blue-600" />
            Site Service Location
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <Input
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="123 Main St"
                className="min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Suite / Unit / Apt
              </label>
              <Input
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Unit 4B"
                className="min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="San Francisco"
                className="min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="CA"
                className="min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="94103"
                className="min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Internal Dispatch Notes (Gate codes, dog warning, special tools)
            </label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="e.g. Gate code #4829, watch out for German Shepherd in back yard, bring 100ft snake."
              className="w-full p-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/jobs">
          <Button variant="outline" type="button" className="min-h-[44px]">
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="min-h-[44px] font-bold shadow-sm"
        >
          <CalendarCheck2 className="w-4 h-4 mr-2" />
          {loading ? 'Scheduling Job...' : 'Schedule & Dispatch Job'}
        </Button>
      </div>

      {/* Sticky Mobile Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur border-t border-slate-200 z-50 shadow-2xl flex items-center justify-between gap-2">
        <Link href="/jobs" className="flex-1">
          <Button variant="outline" size="sm" type="button" className="w-full min-h-[44px]">
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={loading}
          className="flex-2 min-h-[44px] font-bold"
        >
          <CalendarCheck2 className="w-4 h-4 mr-1.5" />
          {loading ? 'Saving...' : 'Schedule Job'}
        </Button>
      </div>
    </form>
  );
}
