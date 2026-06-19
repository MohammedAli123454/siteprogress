"use client";

import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import { DeleteRowDialog } from "./components/dialogs/DeleteRowDialog";
import { NewMocDialog } from "./components/dialogs/NewMocDialog";
import { EditorToolbar } from "./components/EditorToolbar";
import { RecordsTable } from "./components/records-table/RecordsTable";
import { useJointInchDiaEditor } from "./hooks/useJointInchDiaEditor";

export default function JointInchDiaEditorPage() {
  const editor = useJointInchDiaEditor();

  return (
    <div className="h-screen overflow-hidden bg-slate-50 py-3 pl-[var(--page-left-offset,2.75rem)] pr-3">
      <div className="mx-auto flex h-full min-h-0 max-w-none flex-col gap-3">
        <div className="shrink-0">
          <EditorToolbar
            selectedMoc={editor.selectedMoc}
            mocOptions={editor.mocOptions}
            isExportDisabled={editor.visibleTableRowCount === 0}
            isExporting={editor.isExporting}
            hasUnsavedChanges={editor.hasUnsavedChanges}
            isSavingChanges={editor.isSavingChanges}
            unsavedChangeCount={editor.unsavedChangeCount}
            onMocChange={editor.setSelectedMoc}
            onSaveChanges={editor.handleSaveChanges}
            onDiscardChanges={editor.handleDiscardChanges}
            onExportExcel={editor.handleExportToExcel}
          />
        </div>

        <section className="min-h-0 flex-1">
          {editor.isLoading ? (
            <div className="flex h-[520px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : editor.isError ? (
            <div className="m-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {editor.error instanceof Error ? editor.error.message : "Could not load records."}
            </div>
          ) : (
            <div className="h-full min-h-0">
              <RecordsTable
                isAllMocsView={editor.isAllMocsView}
                consolidatedRows={editor.consolidatedRows}
                filteredRecords={editor.filteredRecords}
                dirtyRowIds={editor.dirtyRowIds}
                changedCellKeys={editor.changedCellKeys}
                pendingDeleteIds={editor.pendingDeleteIds}
                rowErrors={editor.rowErrors}
                isSavingChanges={editor.isSavingChanges}
                totals={editor.totals}
                footerLabelColSpan={editor.footerLabelColSpan}
                onAddRow={() => editor.handleAddRow()}
                onUpdateRow={editor.updateRow}
                onDeleteRow={editor.handleDeleteRow}
              />
            </div>
          )}
        </section>
      </div>

      <NewMocDialog
        open={editor.isMocDialogOpen}
        isSaving={editor.isSavingMoc}
        errorMessage={editor.mocErrorMessage}
        onOpenChange={editor.setIsMocDialogOpen}
        onSubmit={editor.handleCreateMoc}
      />

      <DeleteRowDialog
        target={editor.deleteTarget}
        isDeleting={editor.isSavingChanges}
        onOpenChange={(open) => !open && editor.closeDeleteDialog()}
        onConfirm={editor.handleConfirmDelete}
      />

      <TransactionToast notice={editor.transactionNotice} />
    </div>
  );
}

function TransactionToast({
  notice,
}: {
  notice: { id: number; message: string; tone: "success" | "error" } | null;
}) {
  if (!notice) return null;

  const Icon = notice.tone === "success" ? CheckCircle2 : AlertTriangle;
  const toneClassName =
    notice.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-emerald-950/10"
      : "border-red-200 bg-red-50 text-red-700 shadow-red-950/10";

  return (
    <div
      key={notice.id}
      role="status"
      className={`fixed bottom-5 right-5 z-50 flex max-w-[min(420px,calc(100vw-2rem))] items-center gap-3 rounded-md border px-4 py-3 text-sm font-semibold shadow-lg ${toneClassName}`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{notice.message}</span>
    </div>
  );
}
