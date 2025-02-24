// app/dashboard/page.tsx

import Dashboard from "@/components/ui/Dashboard";
import { getGroupedMOCs } from "@/app/actions/invoiceActions"; // Changed import

export default async function DashboardPage() {
  const result = await getGroupedMOCs(); // Changed function call

  if (!result.success) {
    return (
      <div className="p-6 text-red-500">
        Error loading data: {result.message}
      </div>
    );
  }

  if (!result.data) {
    return <div className="p-6">No MOC data found</div>;
  }

  return <Dashboard data={result.data} />;
}