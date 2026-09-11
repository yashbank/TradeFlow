'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { MessageSquare, Mail, Copy, Check, ExternalLink, Send, X, BellRing } from 'lucide-react';
import { useToast } from '@/lib/toast/ToastContext';
import { normalizePhoneForUri } from '@/components/dashboard/TechnicianFieldPortal';

export type NotificationType = 'en_route' | 'scheduled' | 'completed' | 'reminder';

interface DispatchNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  technicianName: string;
  serviceAddress: string;
  jobNumber: string;
}

export function generateDispatchMessage(
  type: NotificationType,
  customerName: string,
  technicianName: string,
  serviceAddress: string,
  jobNumber: string
): { subject: string; body: string } {
  switch (type) {
    case 'en_route':
      return {
        subject: `Update on Work Order ${jobNumber}: Technician En Route`,
        body: `Hi ${customerName}, your TradeFlow technician (${technicianName}) is en route to ${serviceAddress} for Work Order ${jobNumber}. Estimated arrival is 8-15 minutes. See you soon!`,
      };
    case 'scheduled':
      return {
        subject: `Confirmed: Plumbing Service Scheduled (${jobNumber})`,
        body: `Hello ${customerName}, your service appointment (${jobNumber}) has been confirmed for ${serviceAddress}. Technician ${technicianName} is assigned to your order.`,
      };
    case 'completed':
      return {
        subject: `Work Completed: Work Order ${jobNumber}`,
        body: `Hello ${customerName}, your plumbing work order (${jobNumber}) at ${serviceAddress} has been completed by ${technicianName}. Thank you for choosing TradeFlow!`,
      };
    case 'reminder':
      return {
        subject: `Reminder: Upcoming Plumbing Service Appointment (${jobNumber})`,
        body: `Hi ${customerName}, this is a friendly reminder of your upcoming plumbing service appointment (${jobNumber}) at ${serviceAddress}. Technician ${technicianName} will arrive within your scheduled window.`,
      };
  }
}

export function DispatchNotificationModal({
  isOpen,
  onClose,
  customerName,
  customerPhone = '',
  customerEmail = '',
  technicianName,
  serviceAddress,
  jobNumber,
}: DispatchNotificationModalProps) {
  const toast = useToast();
  const [selectedType, setSelectedType] = useState<NotificationType>('en_route');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { subject, body } = generateDispatchMessage(
    selectedType,
    customerName,
    technicianName,
    serviceAddress,
    jobNumber
  );

  const cleanPhone = normalizePhoneForUri(customerPhone);
  const smsUrl = `sms:${cleanPhone}?&body=${encodeURIComponent(body)}`;
  const mailUrl = `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function handleCopy() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(body);
      setCopied(true);
      toast.success('Message Copied', 'Notification text copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-lg shadow-2xl border-sky-500/30 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Dispatch Notification Generator</CardTitle>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Automated Client Dispatch & Arrival Alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Notification Scenario Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1.5">
              Notification Trigger
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'en_route', label: '🚚 En Route (ETA 8m)' },
                { type: 'scheduled', label: '📅 Scheduled & Assigned' },
                { type: 'completed', label: '✅ Work Order Done' },
                { type: 'reminder', label: '⏰ Service Reminder' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setSelectedType(item.type as NotificationType)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                    selectedType === item.type
                      ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                      : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Generated Message Content
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1 hover:underline min-h-[28px]"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 text-xs text-slate-800 dark:text-zinc-200 leading-relaxed font-sans select-all">
              {body}
            </div>
          </div>

          {/* Recipient Details */}
          <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 text-xs space-y-1">
            <p className="font-bold text-sky-900 dark:text-sky-200">Recipient Details:</p>
            <p className="text-slate-600 dark:text-zinc-400">
              Customer: <span className="font-semibold text-slate-900 dark:text-zinc-100">{customerName}</span>
            </p>
            {customerPhone && (
              <p className="text-slate-600 dark:text-zinc-400">
                Mobile: <span className="font-mono text-slate-900 dark:text-zinc-100">{customerPhone}</span>
              </p>
            )}
            {customerEmail && (
              <p className="text-slate-600 dark:text-zinc-400">
                Email: <span className="text-slate-900 dark:text-zinc-100">{customerEmail}</span>
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-zinc-800 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="min-h-[44px]"
          >
            Close
          </Button>

          <div className="flex items-center gap-2">
            {customerPhone && (
              <a href={smsUrl} className="inline-block">
                <Button
                  size="sm"
                  type="button"
                  className="min-h-[44px] font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs"
                >
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Open SMS App
                </Button>
              </a>
            )}

            {customerEmail && (
              <a href={mailUrl} className="inline-block">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  className="min-h-[44px] font-bold"
                >
                  <Mail className="w-4 h-4 mr-1.5" />
                  Open Email
                </Button>
              </a>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
