// app/dashboard/page.tsx
import Dashboard from "@/components/ui/Dashboard"
import { getPartialInvoices } from "@/app/actions/invoiceActions";

export default async function DashboardPage() {
  const result = await getPartialInvoices();

  if (!result.success) {
    return (
      <div className="p-6 text-red-500">
        Error loading invoices: {result.message}
      </div>
    );
  }

  // Handle case where data is undefined
  if (!result.data) {
    return <div className="p-6">No invoice data found</div>;
  }

  return <Dashboard data={result.data} />;
}