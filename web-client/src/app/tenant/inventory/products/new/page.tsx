"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Package, CheckCircle2, Layers, DollarSign, ShieldAlert } from 'lucide-react';
import { Button, Input, Select, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { useToast } from '@/context/ToastContext';

export default function NewProductPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'SOLAR_PANEL',
    sku: '',
    brand: '',
    unit: 'NOS',
    purchaseCost: '',
    sellingPrice: '',
    taxRate: '12',
    minStock: '10',
    reorderLevel: '20',
    isSerialized: true,
    isBatchTracked: false,
  });

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast({ type: 'warning', message: 'Product name is required.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        sku: formData.sku.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        unit: formData.unit,
        purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : 0,
        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : 0,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : 0,
        minStock: formData.minStock ? parseInt(formData.minStock, 10) : 0,
        reorderLevel: formData.reorderLevel ? parseInt(formData.reorderLevel, 10) : 0,
        isSerialized: formData.isSerialized,
        isBatchTracked: formData.isBatchTracked,
      };

      const res = await axios.post(`${apiBase}/api/tenant/inventory/products`, payload, {
        withCredentials: true,
      });

      showToast({
        type: 'success',
        title: 'Product Created',
        message: `${res.data?.product?.name || formData.name} added to warehouse inventory!`,
      });
      router.push('/tenant/inventory/products');
    } catch (err: any) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: err.response?.data?.error || err.response?.data?.message || 'Failed to add product to catalogue.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Link
          href="/tenant/inventory/products"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          aria-label="Back to Products"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Product</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Register solar hardware, DCR modules, inverters, and BOS components in the master catalogue.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Package size={18} />
              </div>
              <div>
                <CardTitle>Hardware Identification</CardTitle>
                <CardDescription>Primary specifications, make, model, and item category</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product Name *"
                required
                placeholder="e.g. Adani 545W Mono PERC DCR Module"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Select
                label="Hardware Category *"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={[
                  { value: 'SOLAR_PANEL', label: 'Solar PV Panels / Modules' },
                  { value: 'INVERTER', label: 'Solar Inverters (On-Grid / Hybrid)' },
                  { value: 'STRUCTURE', label: 'Mounting Structures (Galvanized / Aluminum)' },
                  { value: 'CABLE', label: 'Solar DC / AC Cables & Conduits' },
                  { value: 'BOS', label: 'Balance of System (DB, SPD, MCB, Earthing)' },
                  { value: 'BATTERY', label: 'Battery Energy Storage (Lithium / Tubular)' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Brand / Manufacturer"
                placeholder="e.g. Adani, Waaree, Sungrow"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
              <Input
                label="SKU / Item Code"
                placeholder="e.g. MOD-ADA-545-DCR"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
              <Select
                label="Unit of Measurement"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                options={[
                  { value: 'NOS', label: 'Pieces (NOS)' },
                  { value: 'METERS', label: 'Meters (MTR)' },
                  { value: 'SETS', label: 'Sets (SET)' },
                  { value: 'KG', label: 'Kilograms (KG)' },
                  { value: 'KW', label: 'Kilowatt (kW)' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <DollarSign size={18} />
              </div>
              <div>
                <CardTitle>Financial & Tax Configuration</CardTitle>
                <CardDescription>Procurement baseline cost, default selling price, and applicable GST rate</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Purchase Cost (₹)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.purchaseCost}
                onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
              />
              <Input
                label="Selling Price (₹)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              />
              <Select
                label="GST Tax Rate"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                options={[
                  { value: '12', label: '12% (Standard Solar Equipment)' },
                  { value: '18', label: '18% (General Commercial / Services)' },
                  { value: '5', label: '5% (Concessional Renewable)' },
                  { value: '0', label: '0% (Exempt)' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Layers size={18} />
              </div>
              <div>
                <CardTitle>Warehouse Stock & Traceability</CardTitle>
                <CardDescription>Stock threshold levels and individual serial number tracking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Safety Minimum Stock Level"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                helperText="Triggers low-stock warnings when inventory drops below this quantity."
              />
              <Input
                label="Automated Reorder Threshold"
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                helperText="Recommended reorder point for procurement planning."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isSerialized}
                  onChange={(e) => setFormData({ ...formData, isSerialized: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">DCR / Serial Number Tracking</span>
                  <span className="text-[11px] text-slate-500">Each individual unit has a barcode/QR scanned into statutory PM Surya Ghar slips.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isBatchTracked}
                  onChange={(e) => setFormData({ ...formData, isBatchTracked: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Batch / Lot Tracking</span>
                  <span className="text-[11px] text-slate-500">Track manufacturing batches for cable spools and structure hardware lots.</span>
                </div>
              </label>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/tenant/inventory/products">
              <Button type="button" variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
              leftIcon={<CheckCircle2 size={16} />}
            >
              Save Product
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
