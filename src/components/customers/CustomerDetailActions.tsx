'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EditCustomerModal } from './EditCustomerModal';
import { DeleteConfirmationModal } from '@/components/common/DeleteConfirmationModal';
import { deleteCustomerAction, getCustomerLinkedCountsAction } from '@/actions/customers';
import { useToast } from '@/lib/toast/ToastContext';
import { Plus, Trash2 } from 'lucide-react';
import type { Customer } from '@/types/database';

interface CustomerDetailActionsProps {
  customer: Customer;
}

export function CustomerDetailActions({ customer }: CustomerDetailActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cascadeInfo, setCascadeInfo] = useState<{
    quotesCount: number;
    jobsCount: number;
    invoicesCount: number;
  } | null>(null);

  async function openDeleteModal() {
    const res = await getCustomerLinkedCountsAction(customer.id);
    if (res.success && res.data) {
      setCascadeInfo(res.data);
    }
    setShowDeleteModal(true);
  }

  async function handleDelete(forceCascade?: boolean) {
    const res = await deleteCustomerAction(customer.id, forceCascade);
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete customer');
    }
    toast.success('Customer Deleted', `${customer.first_name} ${customer.last_name} has been removed.`);
    router.push('/customers');
  }

  const hasLinked = Boolean(
    cascadeInfo && (cascadeInfo.quotesCount > 0 || cascadeInfo.jobsCount > 0 || cascadeInfo.invoicesCount > 0)
  );

  return (
    <div className="flex items-center gap-2">
      <EditCustomerModal customer={customer} />

      <Link href={`/quotes/new?customer_id=${customer.id}`}>
        <Button size="sm" className="min-h-[44px]">
          <Plus className="w-4 h-4 mr-1.5" />
          Create Quote
        </Button>
      </Link>

      <Button
        variant="outline"
        size="sm"
        onClick={openDeleteModal}
        className="min-h-[44px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
      >
        <Trash2 className="w-4 h-4 mr-1.5" />
        Delete
      </Button>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Customer Profile"
        entityName={`${customer.first_name} ${customer.last_name}`}
        hasCascadeImpact={hasLinked}
        cascadeDetails={cascadeInfo || undefined}
        warningMessage={
          hasLinked
            ? `This customer has linked active transactions. Deleting them will require confirming cascading removal.`
            : `Are you sure you want to permanently delete this customer profile?`
        }
      />
    </div>
  );
}
