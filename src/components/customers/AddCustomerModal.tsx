'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { createCustomerAction } from '@/actions/customers';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/lib/toast/ToastContext';

export function AddCustomerModal() {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      company_name: (formData.get('company_name') as string) || null,
      email: (formData.get('email') as string) || null,
      phone: formData.get('phone') as string,
      address_line1: formData.get('address_line1') as string,
      address_line2: (formData.get('address_line2') as string) || null,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      postal_code: formData.get('postal_code') as string,
      country: 'US' as const,
      notes: (formData.get('notes') as string) || null,
    };

    const res = await createCustomerAction(payload);
    setLoading(false);

    if (res.success) {
      toast.success('Customer Created', `${payload.first_name} ${payload.last_name} added successfully`);
      setIsOpen(false);
    } else {
      setError(res.error || 'Failed to save customer');
      toast.error('Failed to Create Customer', res.error || 'Failed to save customer');
    }
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="sm">
        <Plus className="w-4 h-4 mr-1.5" />
        Add Customer
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">New Customer Record</CardTitle>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-3 pt-2">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      First Name *
                    </label>
                    <Input name="first_name" required placeholder="e.g. Sarah" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Last Name *
                    </label>
                    <Input name="last_name" required placeholder="e.g. Jenkins" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Phone Number *
                  </label>
                  <Input type="tel" name="phone" required placeholder="e.g. (555) 019-2834" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <Input type="email" name="email" placeholder="sarah.jenkins@example.com" />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Service Street Address *
                  </label>
                  <Input name="address_line1" required placeholder="742 Evergreen Terrace" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">City *</label>
                    <Input name="city" required placeholder="Springfield" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">State *</label>
                    <Input name="state" required placeholder="IL" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Zip *</label>
                    <Input name="postal_code" required placeholder="62704" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Internal Gate/Access Notes
                  </label>
                  <Input name="notes" placeholder="Gate code #4491, dog in backyard" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Create Customer'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
