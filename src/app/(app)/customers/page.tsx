import React from 'react';
import Link from 'next/link';
import { CustomerService } from '@/services/CustomerService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { Phone, MapPin, Search, ChevronRight, User } from 'lucide-react';

interface CustomersPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { q } = await searchParams;
  const { customers, totalCount } = await CustomerService.list(q);

  return (
    <div className="space-y-6">
      {/* Header & Add Customer Modal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalCount} customer record{totalCount === 1 ? '' : 's'} managed
          </p>
        </div>
        <AddCustomerModal />
      </div>

      {/* Search Input Filter */}
      <Card>
        <CardContent className="p-3">
          <form method="GET" className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={q || ''}
              placeholder="Search by name, phone, or address..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border-0 focus:outline-none placeholder:text-slate-400"
            />
          </form>
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="grid grid-cols-1 gap-3">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <User className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">No customer records found.</p>
              <p className="text-xs text-slate-400">Add a customer to begin creating quotes and jobs.</p>
            </CardContent>
          </Card>
        ) : (
          customers.map((cust) => (
            <Link key={cust.id} href={`/customers/${cust.id}`} className="block">
              <Card className="hover:border-blue-400 transition-colors">
                <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-base">
                        {cust.first_name} {cust.last_name}
                      </span>
                      {cust.company_name && (
                        <span className="text-xs text-slate-500 font-normal">({cust.company_name})</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center text-slate-700">
                        <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {cust.phone}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {cust.address_line1}, {cust.city}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
