'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { updateCustomerAction } from '@/actions/customers';
import { Edit, X } from 'lucide-react';
import { useToast } from '@/lib/toast/ToastContext';
import type { Customer } from '@/types/database';

interface EditCustomerModalProps {
  customer: Customer;
}

export function EditCustomerModal({ customer }: EditCustomerModalProps) {
  const router = useRouter();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(customer.first_name);
  const [lastName, setLastName] = useState(customer.last_name);
  const [companyName, setCompanyName] = useState(customer.company_name || '');
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email || '');
  const [addressLine1, setAddressLine1] = useState(customer.address_line1);
  const [addressLine2, setAddressLine2] = useState(customer.address_line2 || '');
  const [city, setCity] = useState(customer.city);
  const [state, setState] = useState(customer.state);
  const [postalCode, setPostalCode] = useState(customer.postal_code);
  const [notes, setNotes] = useState(customer.notes || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      company_name: companyName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim(),
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim() || null,
      city: city.trim(),
      state: state.trim(),
      postal_code: postalCode.trim(),
      notes: notes.trim() || null,
    };

    const res = await updateCustomerAction(customer.id, payload);
    setLoading(false);

    if (res.success) {
      toast.success('Customer Updated', `${payload.first_name} ${payload.last_name} details updated.`);
      setIsOpen(false);
      router.refresh();
    } else {
      setError(res.error || 'Failed to update customer');
      toast.error('Update Failed', res.error || 'Could not update customer');
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="min-h-[44px] text-xs font-bold"
      >
        <Edit className="w-3.5 h-3.5 mr-1.5" />
        Edit Customer
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass-panel-elevated shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-lg text-slate-900 dark:text-zinc-100">
                Edit Customer Record
              </CardTitle>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200 min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-xl transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-3 pt-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-md border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      First Name *
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Last Name *
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Company Name
                  </label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Service Street Address *
                  </label>
                  <Input
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Suite / Apt / Unit
                  </label>
                  <Input
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      City *
                    </label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      State *
                    </label>
                    <Input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Postal Code *
                    </label>
                    <Input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                    Internal Access Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 p-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="min-h-[44px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-h-[44px] font-bold"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
