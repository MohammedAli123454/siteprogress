"use client";

import dynamic from "next/dynamic";

const AddNewProjectPage = dynamic(
  () => import("@/features/joint-inch-dia/AddNewProjectPage"),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-slate-50" />,
  }
);

export default function Page() {
  return <AddNewProjectPage />;
}
