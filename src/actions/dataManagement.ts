'use server';

import { AuthService } from '@/services/AuthService';
import { DataManagementService, type PurgeEntity } from '@/services/DataManagementService';
import { revalidatePath } from 'next/cache';

export async function getWorkspaceStatsAction() {
  try {
    const stats = await DataManagementService.getStats();
    return { success: true, data: stats };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function purgeEntityAction(entity: PurgeEntity) {
  try {
    const { organization } = await AuthService.requireRole(['owner']);

    switch (entity) {
      case 'invoices':
        await DataManagementService.purgeInvoices(organization.id);
        break;
      case 'jobs':
        await DataManagementService.purgeJobs(organization.id);
        break;
      case 'quotes':
        await DataManagementService.purgeQuotes(organization.id);
        break;
      case 'customers':
        await DataManagementService.purgeCustomers(organization.id);
        break;
      case 'all':
        await DataManagementService.purgeAll(organization.id);
        break;
      default:
        throw new Error('Invalid purge entity');
    }

    revalidatePath('/dashboard');
    revalidatePath('/customers');
    revalidatePath('/quotes');
    revalidatePath('/jobs');
    revalidatePath('/invoices');
    revalidatePath('/settings');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
