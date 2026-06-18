"use client";

import { Loader2 } from "lucide-react";

import { DeleteRowDialog } from "./components/dialogs/DeleteRowDialog";
import { NewMocDialog } from "./components/dialogs/NewMocDialog";
import { EditorToolbar } from "./components/EditorToolbar";
import { RecordsTable } from "./components/records-table/RecordsTable";
import { useJointInchDiaEditor } from "./hooks/useJointInchDiaEditor";

export default function JointInchDiaEditorPage() {
  const editor = useJointInchDiaEditor();

  return (
    <div className="min-h-screen bg-slate-50 py-4 pl-[var(--page-left-offset,2.75rem)] pr-3">
      <div className="mx-auto max-w-none space-y-4">
        <EditorToolbar
          selectedMoc={editor.selectedMoc}
          mocOptions={editor.mocOptions}
          totals={editor.totals}
          isExportDisabled={editor.visibleTableRowCount === 0}
          isExporting={editor.isExporting}
          onMocChange={editor.setSelectedMoc}
          onExportExcel={editor.handleExportToExcel}
        />

        <section>
          {editor.isLoading ? (
            <div className="flex h-[520px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : editor.isError ? (
            <div className="m-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {editor.error instanceof Error ? editor.error.message : "Could not load records."}
            </div>
          ) : (
            <div>
              <RecordsTable
                isAllMocsView={editor.isAllMocsView}
                consolidatedRows={editor.consolidatedRows}
                filteredRecords={editor.filteredRecords}
                savingRowIds={editor.savingRowIds}
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
        isDeleting={editor.deleteTarget ? editor.savingRowIds.has(editor.deleteTarget.id) : false}
        onOpenChange={(open) => !open && editor.closeDeleteDialog()}
        onConfirm={editor.handleConfirmDelete}
      />
    </div>
  );
}
