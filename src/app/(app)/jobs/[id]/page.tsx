import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobService } from '@/services/JobService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JobDetailActions } from '@/components/jobs/JobDetailActions';
import { formatDateTime, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Navigation,
  Clock,
  User,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const job = await JobService.getById(id);

  if (!job) {
    notFound();
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${job.address_line1}, ${job.city}, ${job.state} ${job.postal_code}`
  )}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/jobs" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Jobs
        </Link>
        <JobDetailActions job={job} />
      </div>

      {/* Completed Status Banner */}
      {job.status === 'completed' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Job Completed</p>
              <p className="text-xs text-emerald-700">
                Finished on {formatDateTime(job.completed_at)}. Ready for customer invoice generation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Job Information Card */}
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{job.job_number}</h1>
                <Badge
                  variant={
                    job.status === 'completed'
                      ? 'success'
                      : job.status === 'in_progress'
                      ? 'default'
                      : job.status === 'cancelled'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {job.status}
                </Badge>
              </div>
              <h2 className="text-base font-semibold text-slate-700 mt-1">{job.title}</h2>
            </div>

            {/* Mobile 1-Tap Driving Directions */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors border border-blue-200 min-h-[44px]"
            >
              <Navigation className="w-4 h-4 mr-2 text-blue-600" />
              Get Directions
            </a>
          </div>

          {/* Schedule & Assignment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Schedule Window
              </span>
              <p className="text-sm font-medium text-slate-800 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                {job.scheduled_start ? formatDateTime(job.scheduled_start) : 'Not scheduled yet'}
              </p>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Assigned Technician
              </span>
              <p className="text-sm font-medium text-slate-800 flex items-center">
                <User className="w-4 h-4 mr-1.5 text-slate-400" />
                {job.assigned_to?.full_name || 'Unassigned'}
              </p>
            </div>
          </div>

          {/* Customer & Service Location */}
          <div className="border border-slate-200 p-4 rounded-lg space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Customer & Service Address
            </span>
            <p className="font-bold text-slate-900 text-base">
              {job.customer?.first_name} {job.customer?.last_name}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600">
              {job.customer?.phone && (
                <a href={`tel:${job.customer.phone}`} className="flex items-center text-blue-600 font-medium hover:underline min-h-[44px]">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {job.customer.phone}
                </a>
              )}
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {job.address_line1}, {job.city}, {job.state} {job.postal_code}
              </span>
            </div>
          </div>

          {/* Agreed Scope & Work Description */}
          {job.description && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Scope of Work
              </h3>
              <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </div>
          )}

          {/* Technician Internal Notes */}
          {job.internal_notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Technician Field Notes
              </h3>
              <div className="bg-amber-50/60 p-4 rounded-lg border border-amber-200 text-xs text-slate-700 whitespace-pre-wrap">
                {job.internal_notes}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
