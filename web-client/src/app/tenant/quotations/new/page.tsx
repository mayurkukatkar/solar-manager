"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { QuotationWizardModal } from '@/components/quotations/QuotationWizardModal';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { useToast } from '@/context/ToastContext';

function NewQuotationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const projectId = searchParams.get('projectId') || '';
  const customerId = searchParams.get('customerId') || '';
  const leadId = searchParams.get('leadId') || '';

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(true);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    async function loadResources() {
      try {
        const [leadsRes, custsRes, prodsRes, surveysRes, tenantRes] = await Promise.all([
          axios.get(`${apiBase}/api/tenant/leads`, { withCredentials: true }).catch(() => ({ data: { leads: [] } })),
          axios.get(`${apiBase}/api/tenant/crm`, { withCredentials: true }).catch(() => ({ data: { customers: [] } })),
          axios.get(`${apiBase}/api/tenant/inventory/products`, { withCredentials: true }).catch(() => ({ data: { products: [] } })),
          axios.get(`${apiBase}/api/tenant/surveys`, { withCredentials: true }).catch(() => ({ data: { surveys: [] } })),
          axios.get(`${apiBase}/api/tenant/settings/company`, { withCredentials: true }).catch(() => ({ data: { tenant: null } })),
        ]);

        setLeads(leadsRes.data?.leads || []);
        setCustomers(custsRes.data?.customers || []);
        setProducts(prodsRes.data?.products || []);
        setSurveys(surveysRes.data?.surveys || []);
        setTenantInfo(tenantRes.data?.tenant || null);
      } catch (err) {
        console.error('Failed to load quotation dependencies', err);
      } finally {
        setLoading(false);
      }
    }
    loadResources();
  }, [apiBase]);

  const handleClose = () => {
    setIsWizardOpen(false);
    router.push('/tenant/quotations');
  };

  const handleSuccess = () => {
    setIsWizardOpen(false);
    showToast({
      type: 'success',
      title: 'Quotation Generated',
      message: 'New solar commercial quotation created successfully!',
    });
    router.push('/tenant/quotations');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold text-slate-600">Initializing 60-Second Quotation Wizard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/tenant/quotations"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          aria-label="Back to Quotations"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Solar Quotation</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Launch the 60-second commercial solar proposal generator and financial modeler.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Sparkles size={18} />
            </div>
            <div>
              <CardTitle>Interactive Quotation Engine</CardTitle>
              <CardDescription>
                Compute system capacity, solar cash flows, 25-year ROI, and statutory 13.8% composite GST
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-center py-8">
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            The quotation wizard modal is ready. Click below to launch the multi-stage pricing studio.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsWizardOpen(true)}
            leftIcon={<Sparkles size={18} />}
          >
            Launch Proposal Wizard
          </Button>
        </CardContent>
      </Card>

      <QuotationWizardModal
        isOpen={isWizardOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        leads={leads}
        customers={customers}
        products={products}
        surveys={surveys}
        tenantInfo={tenantInfo}
        preselectedLeadId={leadId}
        preselectedCustomerId={customerId}
      />
    </div>
  );
}

export default function NewQuotationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading quotation studio...</div>}>
      <NewQuotationContent />
    </Suspense>
  );
}
