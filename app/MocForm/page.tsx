"use client";

import { useState, useTransition } from "react";
import { addMOC } from "@/app/actions/invoiceActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MOCFormProps {
  onMOCAdded?: () => void;
}

export default function MOCForm({ onMOCAdded = () => {} }: MOCFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    mocNo: "",
    cwo: "",
    po: "",
    proposal: "",
    contractValue: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await addMOC({
        mocNo: formData.mocNo,
        cwo: formData.cwo,
        po: formData.po,
        proposal: formData.proposal,
        contractValue: parseFloat(formData.contractValue),
      });
      if (res.success) {
        setFormData({
          mocNo: "",
          cwo: "",
          po: "",
          proposal: "",
          contractValue: "",
        });
        onMOCAdded();
      } else {
        alert("Error adding MOC: " + res.message);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          Add New MOC
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MOC Number */}
            <div className="space-y-2">
              <Label htmlFor="mocNo" className="text-sm font-medium text-gray-700">
                MOC Number *
              </Label>
              <Input
                id="mocNo"
                type="text"
                value={formData.mocNo}
                onChange={(e) => setFormData({ ...formData, mocNo: e.target.value })}
                required
              />
            </div>

            {/* CWO */}
            <div className="space-y-2">
              <Label htmlFor="cwo" className="text-sm font-medium text-gray-700">
                CWO *
              </Label>
              <Input
                id="cwo"
                type="text"
                value={formData.cwo}
                onChange={(e) => setFormData({ ...formData, cwo: e.target.value })}
                required
              />
            </div>

            {/* PO */}
            <div className="space-y-2">
              <Label htmlFor="po" className="text-sm font-medium text-gray-700">
                Purchase Order (PO) *
              </Label>
              <Input
                id="po"
                type="text"
                value={formData.po}
                onChange={(e) => setFormData({ ...formData, po: e.target.value })}
                required
              />
            </div>

            {/* Proposal */}
            <div className="space-y-2">
              <Label htmlFor="proposal" className="text-sm font-medium text-gray-700">
                Proposal *
              </Label>
              <Input
                id="proposal"
                type="text"
                value={formData.proposal}
                onChange={(e) => setFormData({ ...formData, proposal: e.target.value })}
                required
              />
            </div>

            {/* Contract Value */}
            <div className="space-y-2 col-span-full">
              <Label htmlFor="contractValue" className="text-sm font-medium text-gray-700">
                Contract Value (SAR) Excl. VAT *
              </Label>
              <Input
                id="contractValue"
                type="number"
                step="0.01"
                value={formData.contractValue}
                onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                "Add MOC"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}