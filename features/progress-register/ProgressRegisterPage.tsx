"use client";

import { Loader2, Save } from "lucide-react";
import { BarLoader, ClipLoader } from "react-spinners";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ProgressRegisterTable } from "./components/ProgressRegisterTable";
import { ProgressToolbar } from "./components/ProgressToolbar";
import { useProgressRegister } from "./hooks/useProgressRegister";

export default function ProgressRegisterPage() {
  const progress = useProgressRegister();

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-slate-50 py-4 pl-[var(--page-left-offset,2.75rem)] pr-3">
      {progress.isSaving ? (
        <div className="pointer-events-none fixed left-0 top-0 z-[100] w-screen">
          <BarLoader color="#2563eb" height={4} width="100%" />
        </div>
      ) : null}

      <div className="mx-auto min-w-0 max-w-none space-y-4">
        <div className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-200 px-6 pb-3 sm:px-8">
          <h1 className="bg-gradient-to-r from-blue-800 to-violet-600 bg-clip-text text-4xl font-extrabold tracking-normal text-transparent">
            Weld Joints Progress Register
          </h1>
          <Button
            className="h-10 justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 px-5 text-white shadow-sm hover:from-indigo-600 hover:via-blue-600 hover:to-cyan-600 disabled:opacity-60"
            disabled={progress.isAllMocsView || !progress.hasDraftProgress || progress.isSaving}
            aria-busy={progress.isSaving}
            onClick={progress.handleSaveProgress}
          >
            {progress.isSaving ? (
              <ClipLoader
                aria-label="Saving progress"
                color="#ffffff"
                cssOverride={{ marginRight: 8 }}
                size={16}
                speedMultiplier={0.85}
              />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            <span>{progress.isSaving ? "Saving..." : "Save Progress"}</span>
          </Button>
        </div>

        <ProgressToolbar
          selectedMoc={progress.selectedMoc}
          mocOptions={progress.mocOptions}
          progressScope={progress.progressScope}
          reportDate={progress.reportDate}
          remarks={progress.remarks}
          onMocChange={progress.setSelectedMoc}
          onReportDateChange={progress.setReportDate}
          onScopeChange={progress.setProgressScope}
          onRemarksChange={progress.setRemarks}
        />

        <section className="min-w-0 overflow-hidden">
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
            <div className="min-w-0">
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
            </div>
          )}
        </section>

        <ProgressLimitDialog
          balanceJoints={progress.progressLimitWarning?.balanceJoints}
          enteredJoints={progress.progressLimitWarning?.enteredJoints}
          onClose={progress.dismissProgressLimitWarning}
        />
      </div>
    </div>
  );
}

function ProgressLimitDialog({
  balanceJoints,
  enteredJoints,
  onClose,
}: {
  balanceJoints?: number;
  enteredJoints?: number;
  onClose: () => void;
}) {
  const isOpen = balanceJoints !== undefined && enteredJoints !== undefined;
  const balanceText = formatJointQuantity(balanceJoints ?? 0);
  const enteredText = formatJointQuantity(enteredJoints ?? 0);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Progress exceeds balance</DialogTitle>
          <DialogDescription className="leading-6 text-slate-600">
            This row has only {balanceText} available. You entered {enteredText}, which is more
            than the remaining balance. Enter {balanceText} or less to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatJointQuantity(value: number) {
  const quantity = Math.round(value).toLocaleString();
  return `${quantity} ${Math.round(value) === 1 ? "joint" : "joints"}`;
}
