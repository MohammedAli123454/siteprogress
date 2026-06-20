"use client";

import dynamic from "next/dynamic";

const ProgressDashboardPage = dynamic(
  () => import("@/features/progress-dashboard/ProgressDashboardPage"),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-slate-50" />,
  }
);

export default function Page() {
  return <ProgressDashboardPage />;
}
