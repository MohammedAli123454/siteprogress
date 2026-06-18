import type { Row, Workbook, Worksheet } from "exceljs";

import type {
  ConsolidatedPipeRow,
  ExportCell,
  PipeTableSummary,
  RecordTotals,
} from "../domain/calculations";
import { getConsolidatedPipeRows, getRecordTotals } from "../domain/calculations";
import { pipeExportColumns } from "../domain/constants";
import type { JointRecord } from "../domain/types";

type PipeSummaryExportInput = {
  isAllMocsView: boolean;
  consolidatedRows: ConsolidatedPipeRow[];
  filteredRecords: JointRecord[];
  totals: RecordTotals;
  tableSummary: PipeTableSummary;
};

export async function exportPipeSummaryWorkbook({
  isAllMocsView,
  consolidatedRows,
  filteredRecords,
  totals,
  tableSummary,
}: PipeSummaryExportInput) {
  const rows: ExportCell[][] = isAllMocsView
    ? consolidatedRows.map((record) => [
        record.sizeInches,
        record.thickness,
        record.pipeSchedule,
        record.shopJoints,
        record.fieldJoints,
        record.totalJoints,
        record.shopInchDia,
        record.fieldInchDia,
        record.totalInchDia,
      ])
    : filteredRecords.map((record) => [
        record.sizeInches,
        record.thickness,
        record.pipeSchedule || "-",
        record.shopJoints,
        record.fieldJoints,
        record.totalJoints,
        record.shopInchDia,
        record.fieldInchDia,
        record.totalInchDia,
      ]);

  if (!rows.length) return;

  const footerRow: ExportCell[] = [
    "Visible Total",
    "",
    "",
    totals.shopJoints,
    totals.fieldJoints,
    totals.totalJoints,
    totals.shopInchDia,
    totals.fieldInchDia,
    totals.totalInchDia,
  ];
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Pipe Size Summary");
  const title = `${tableSummary.moc} - ${tableSummary.title}`;

  workbook.creator = "Site Progress";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.subject = "Pipe size joints and inch-dia export";
  workbook.title = title;

  formatPipeSummaryWorksheet(worksheet, title, pipeExportColumns, rows, footerRow);

  if (isAllMocsView) {
    addMocWiseDetailsWorksheet(workbook, filteredRecords);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  downloadWorkbookFile(buffer, `${sanitizeFileName(title)}.xlsx`);
}

export function formatPipeSummaryWorksheet(
  worksheet: Worksheet,
  title: string,
  columns: string[],
  rows: ExportCell[][],
  footerRow: ExportCell[]
) {
  const lastColumn = columns.length;

  worksheet.views = [{ state: "frozen", ySplit: 3 }];
  worksheet.properties.defaultRowHeight = 22;
  worksheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
  };

  worksheet.mergeCells(1, 1, 1, lastColumn);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: "FF0F172A" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.mergeCells(2, 1, 2, lastColumn);
  const metaCell = worksheet.getCell(2, 1);
  metaCell.value = `Exported ${new Date().toLocaleString()} | ${rows.length} visible rows`;
  metaCell.font = { size: 10, color: { argb: "FF64748B" } };
  metaCell.alignment = { vertical: "middle", horizontal: "left" };

  const headerRow = worksheet.addRow(columns);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  rows.forEach((rowValues) => {
    const row = worksheet.addRow(rowValues);
    row.height = 24;
  });

  const totalRow = worksheet.addRow(footerRow);
  totalRow.height = 26;
  totalRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true, color: { argb: "FF0F172A" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
  });

  worksheet.columns = [
    { width: 12 },
    { width: 10 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
  ];

  worksheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3, column: lastColumn },
  };

  for (let columnIndex = 2; columnIndex <= lastColumn; columnIndex += 1) {
    worksheet.getColumn(columnIndex).numFmt = "#,##0.##";
  }

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: rowNumber <= 3 || columnNumber <= 3 ? "center" : "right",
        wrapText: true,
      };
    });
  });
}

function addMocWiseDetailsWorksheet(workbook: Workbook, records: JointRecord[]) {
  const worksheet = workbook.addWorksheet("MOC Wise Details");
  const mocGroups = getMocGroups(records);
  const lastColumn = pipeExportColumns.length;

  worksheet.views = [{ state: "frozen", ySplit: 2 }];
  worksheet.properties.defaultRowHeight = 22;
  worksheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
  };

  worksheet.mergeCells(1, 1, 1, lastColumn);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = "MOC Wise Pipe Size Details";
  titleCell.font = { bold: true, size: 16, color: { argb: "FF0F172A" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.mergeCells(2, 1, 2, lastColumn);
  const metaCell = worksheet.getCell(2, 1);
  metaCell.value = `Exported ${new Date().toLocaleString()} | ${mocGroups.length} MOCs`;
  metaCell.font = { size: 10, color: { argb: "FF64748B" } };
  metaCell.alignment = { vertical: "middle", horizontal: "left" };

  mocGroups.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      worksheet.addRow([]);
    }

    const sectionRow = worksheet.addRow([`${group.moc} - ${group.mocName || "No project name"}`]);
    sectionRow.height = 26;
    worksheet.mergeCells(sectionRow.number, 1, sectionRow.number, lastColumn);
    sectionRow.getCell(1).font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
    sectionRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    sectionRow.getCell(1).alignment = { vertical: "middle", horizontal: "left" };

    const headerRow = worksheet.addRow(pipeExportColumns);
    formatHeaderRow(headerRow);

    const consolidatedRows = getConsolidatedPipeRows(group.records);
    consolidatedRows.forEach((record) => {
      const row = worksheet.addRow(getConsolidatedExportRow(record));
      row.height = 24;
    });

    const totals = getRecordTotals(group.records);
    const totalRow = worksheet.addRow(getFooterRow("Grand Total", totals));
    formatTotalRow(totalRow);
  });

  const overallTotalRow = worksheet.addRow(getFooterRow("Overall Grand Total", getRecordTotals(records)));
  overallTotalRow.height = 28;
  overallTotalRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  });

  worksheet.columns = getPipeExportColumnWidths();
  formatWorksheetGrid(worksheet);
}

function getMocGroups(records: JointRecord[]) {
  const groups = new Map<string, { moc: string; mocName: string; records: JointRecord[] }>();

  records.forEach((record) => {
    const moc = record.moc || "No MOC";
    const existingGroup = groups.get(moc);

    if (existingGroup) {
      existingGroup.records.push(record);
      if (!existingGroup.mocName && record.mocName) {
        existingGroup.mocName = record.mocName;
      }
      return;
    }

    groups.set(moc, {
      moc,
      mocName: record.mocName,
      records: [record],
    });
  });

  return Array.from(groups.values()).sort((first, second) => first.moc.localeCompare(second.moc));
}

function getConsolidatedExportRow(record: ConsolidatedPipeRow): ExportCell[] {
  return [
    record.sizeInches,
    record.thickness,
    record.pipeSchedule,
    record.shopJoints,
    record.fieldJoints,
    record.totalJoints,
    record.shopInchDia,
    record.fieldInchDia,
    record.totalInchDia,
  ];
}

function getFooterRow(label: string, totals: RecordTotals): ExportCell[] {
  return [
    label,
    "",
    "",
    totals.shopJoints,
    totals.fieldJoints,
    totals.totalJoints,
    totals.shopInchDia,
    totals.fieldInchDia,
    totals.totalInchDia,
  ];
}

function formatHeaderRow(row: Row) {
  row.height = 28;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });
}

function formatTotalRow(row: Row) {
  row.height = 26;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true, color: { argb: "FF0F172A" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
  });
}

function getPipeExportColumnWidths() {
  return [
    { width: 12 },
    { width: 10 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
  ];
}

function formatWorksheetGrid(worksheet: Worksheet) {
  const lastColumn = pipeExportColumns.length;

  for (let columnIndex = 2; columnIndex <= lastColumn; columnIndex += 1) {
    worksheet.getColumn(columnIndex).numFmt = "#,##0.##";
  }

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: rowNumber <= 2 || columnNumber <= 3 ? "center" : "right",
        wrapText: true,
      };
    });
  });
}

export function downloadWorkbookFile(buffer: BlobPart, fileName: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function sanitizeFileName(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "pipe-size-summary"
  );
}
