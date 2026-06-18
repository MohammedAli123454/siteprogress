"use client";

import dynamic from "next/dynamic";

const JointInchDiaEditorPage = dynamic(
  () => import("@/features/joint-inch-dia/JointInchDiaEditorPage"),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-slate-50" />,
  }
);

export default function Page() {
  return <JointInchDiaEditorPage />;
}
