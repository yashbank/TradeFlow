'use server';

import { CustomerService } from '@/services/CustomerService';
import { CustomerSchema, type CustomerInput } from '@/lib/validations/customer';
import { revalidatePath } from 'next/cache';

export async function createCustomerAction(input: CustomerInput) {
  const parsed = CustomerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0].message,
    };
  }

  try {
    const customer = await CustomerService.create(parsed.data);
    revalidatePath('/customers');
    return {
      success: true,
      data: customer,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function updateCustomerAction(customerId: string, input: Partial<CustomerInput>) {
  try {
    const customer = await CustomerService.update(customerId, input);
    revalidatePath('/customers');
    revalidatePath(`/customers/${customerId}`);
    return {
      success: true,
      data: customer,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function getCustomerLinkedCountsAction(customerId: string) {
  try {
    const counts = await CustomerService.getLinkedEntityCounts(customerId);
    return {
      success: true,
      data: counts,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function deleteCustomerAction(customerId: string, forceCascade: boolean = false) {
  try {
    await CustomerService.delete(customerId, forceCascade);
    revalidatePath('/customers');
    revalidatePath('/dashboard');
    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    };
  }
}
