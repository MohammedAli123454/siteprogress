"use client";

import dynamic from "next/dynamic";

const ProgressRegisterPage = dynamic(
  () => import("@/features/progress-register/ProgressRegisterPage"),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-slate-50" />,
  }
);

export default function Page() {
  return <ProgressRegisterPage />;
}
