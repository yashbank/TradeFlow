'use server';
import { getFriendlyErrorMessage } from '@/lib/errorHandler';

import { JobService } from '@/services/JobService';
import { InvoiceService } from '@/services/InvoiceService';
import { CreateJobSchema, type CreateJobInput } from '@/lib/validations/job';
import type { JobStatus } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function createJobAction(input: CreateJobInput) {
  const parsed = CreateJobSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  try {
    const job = await JobService.create(parsed.data);
    revalidatePath('/jobs');
    return {
      success: true,
      data: job,
    };
  } catch (err: any) {
    return {
      success: false,
      error: getFriendlyErrorMessage(err),
    };
  }
}

export async function updateJobStatusAction(
  jobId: string,
  targetStatus: JobStatus,
  internalNotes?: string
) {
  try {
    const job = await JobService.updateStatus(jobId, targetStatus, internalNotes);
    revalidatePath('/jobs');
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath('/dashboard');
    return {
      success: true,
      data: job,
    };
  } catch (err: any) {
    return {
      success: false,
      error: getFriendlyErrorMessage(err),
    };
  }
}

export async function convertJobToInvoiceAction(jobId: string) {
  try {
    const invoice = await InvoiceService.convertFromJob(jobId);
    revalidatePath('/jobs');
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath('/invoices');
    return {
      success: true,
      data: invoice,
    };
  } catch (err: any) {
    return {
      success: false,
      error: getFriendlyErrorMessage(err),
    };
  }
}

export async function updateJobAction(
  jobId: string,
  input: Partial<CreateJobInput> & { internal_notes?: string }
) {
  try {
    const job = await JobService.update(jobId, input);
    revalidatePath('/jobs');
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath('/dashboard');
    return {
      success: true,
      data: job,
    };
  } catch (err: any) {
    return {
      success: false,
      error: getFriendlyErrorMessage(err),
    };
  }
}

export async function assignJobTechnicianAction(jobId: string, technicianId: string | null) {
  try {
    const job = await JobService.update(jobId, { assigned_to_user_id: technicianId || null });
    revalidatePath('/jobs');
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath('/dashboard');
    return {
      success: true,
      data: job,
    };
  } catch (err: any) {
    return {
      success: false,
      error: getFriendlyErrorMessage(err),
    };
  }
}

export async function deleteJobAction(jobId: string) {
  try {
    await JobService.delete(jobId);
    revalidatePath('/jobs');
    revalidatePath('/dashboard');
    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: getFriendlyErrorMessage(err),
    };
  }
}
