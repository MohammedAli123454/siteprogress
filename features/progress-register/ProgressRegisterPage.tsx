"use client";

import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { ProgressRegisterTable } from "./components/ProgressRegisterTable";
import { ProgressSummaryCard } from "./components/ProgressSummaryCard";
import { ProgressToolbar } from "./components/ProgressToolbar";
import { ALL_MOCS } from "./domain/constants";
import { useProgressRegister } from "./hooks/useProgressRegister";

export default function ProgressRegisterPage() {
  const progress = useProgressRegister();
  const scopeLabel = progress.progressScope === "SHOP" ? "Shop" : "Field";

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4">
      <div className="mx-auto max-w-none space-y-4">
        <ProgressToolbar
          selectedMoc={progress.selectedMoc}
          mocOptions={progress.mocOptions}
          progressScope={progress.progressScope}
          reportDate={progress.reportDate}
          reportNo={progress.reportNo}
          remarks={progress.remarks}
          isSaveDisabled={progress.isAllMocsView || !progress.hasDraftProgress}
          isSaving={progress.isSaving}
          onMocChange={progress.setSelectedMoc}
          onScopeChange={progress.setProgressScope}
          onReportDateChange={progress.setReportDate}
          onReportNoChange={progress.setReportNo}
          onRemarksChange={progress.setRemarks}
          onSave={progress.handleSaveProgress}
        />

        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-slate-900 text-white hover:bg-slate-900">
                  {progress.selectedMoc === ALL_MOCS ? "All MOCs" : progress.selectedMoc}
                </Badge>
                <span className="truncate text-xl font-bold text-slate-950">
                  {progress.selectedMoc === ALL_MOCS
                    ? `${scopeLabel} progress summary`
                    : progress.selectedMocName}
                </span>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-500">
              {progress.selectedMoc === ALL_MOCS
                ? "Select one MOC to enter new progress."
                : "Enter joint progress only. Inch-dia is calculated automatically."}
            </span>
          </div>

          {progress.message ? (
            <div className="border-b border-slate-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {progress.message}
            </div>
          ) : null}

          {progress.isLoading ? (
            <div className="flex h-[520px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : progress.isError ? (
            <div className="m-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {progress.error instanceof Error
                ? progress.error.message
                : "Could not load progress register."}
            </div>
          ) : (
            <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <ProgressRegisterTable
                isAllMocsView={progress.isAllMocsView}
                rows={progress.visibleRows}
                mocSummaries={progress.mocSummaries}
                scope={progress.progressScope}
                totals={progress.totals}
                draftProgress={progress.draftProgress}
                getScopeJoints={progress.getScopeJoints}
                getPreviousJoints={progress.getPreviousJoints}
                getRemainingJoints={progress.getRemainingJoints}
                onProgressChange={progress.handleProgressChange}
              />
              <ProgressSummaryCard totals={progress.totals} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
