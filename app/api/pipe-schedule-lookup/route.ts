import { NextResponse } from "next/server";
import { z } from "zod";

import { sql } from "@/app/configs/db";
import { parsePipeSize } from "@/lib/pipe-size";

export const dynamic = "force-dynamic";

const lookupSchema = z.object({
  size: z.string().trim().min(1),
  schedule: z.string().trim().min(1),
});

type PipeScheduleDatabaseRow = {
  id: number;
  standard_code: string;
  standard_name: string;
  material_group: string;
  unit: string;
  nps: string;
  nps_decimal: string | number;
  outside_diameter_in: string | number;
  schedule: string;
  wall_thickness_in: string | number;
  source_sheet: string;
  source_row_number: number | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const payload = lookupSchema.safeParse({
      size: searchParams.get("size"),
      schedule: searchParams.get("schedule"),
    });

    if (!payload.success) {
      return NextResponse.json(
        { error: "Pipe size and schedule are required for lookup." },
        { status: 400 }
      );
    }

    const sizeDecimal = parsePipeSize(payload.data.size);
    const scheduleCandidates = getScheduleCandidates(payload.data.schedule);

    if (!sizeDecimal || scheduleCandidates.length === 0) {
      return NextResponse.json({
        data: [],
        availableSchedules: [],
        lookup: {
          size: payload.data.size,
          sizeDecimal,
          schedule: payload.data.schedule,
          scheduleCandidates,
        },
      });
    }

    const rows = await sql`
      SELECT
        id,
        standard_code,
        standard_name,
        material_group,
        unit,
        nps,
        nps_decimal,
        outside_diameter_in,
        schedule,
        wall_thickness_in,
        source_sheet,
        source_row_number
      FROM pipe_schedule_wall_thicknesses
      WHERE abs(nps_decimal - ${sizeDecimal}) < 0.0001
      ORDER BY standard_code, material_group, schedule
    `;

    const candidateSet = new Set(scheduleCandidates.map((schedule) => normalizeSchedule(schedule)));
    const matchedRows = (rows as PipeScheduleDatabaseRow[]).filter((row) =>
      candidateSet.has(normalizeSchedule(row.schedule))
    );

    return NextResponse.json({
      data: matchedRows.map(normalizePipeScheduleRow),
      availableSchedules: Array.from(new Set((rows as PipeScheduleDatabaseRow[]).map((row) => row.schedule))).sort(
        naturalSort
      ),
      lookup: {
        size: payload.data.size,
        sizeDecimal,
        schedule: payload.data.schedule,
        scheduleCandidates,
      },
    });
  } catch (error) {
    console.error("Failed to look up pipe schedule:", error);
    return NextResponse.json({ error: "Failed to look up pipe schedule details." }, { status: 500 });
  }
}

function normalizePipeScheduleRow(row: PipeScheduleDatabaseRow) {
  const outsideDiameterIn = toNumber(row.outside_diameter_in);
  const wallThicknessIn = toNumber(row.wall_thickness_in);

  return {
    id: row.id,
    standardCode: row.standard_code,
    standardName: row.standard_name,
    materialGroup: row.material_group,
    unit: row.unit,
    nps: row.nps,
    npsDecimal: toNumber(row.nps_decimal),
    outsideDiameterIn,
    schedule: row.schedule,
    wallThicknessIn,
    insideDiameterIn: Math.max(0, outsideDiameterIn - wallThicknessIn * 2),
    sourceSheet: row.source_sheet,
    sourceRowNumber: row.source_row_number,
  };
}

function getScheduleCandidates(value: string) {
  const rawValue = value.trim();
  const upperValue = rawValue.toUpperCase();
  const candidates = new Set<string>();

  if (upperValue.includes("XXS")) {
    candidates.add("XXS");
    candidates.add("Sch XXS");
  } else if (upperValue.includes("XS")) {
    candidates.add("XS");
    candidates.add("Sch XS");
  }

  if (upperValue.includes("STD")) {
    candidates.add("STD");
    candidates.add("Sch STD");
  }

  const schMatch = upperValue.match(/\bSCH(?:EDULE)?\s*([0-9]+S?)\b/);
  if (schMatch?.[1]) {
    const scheduleNumber = schMatch[1].toUpperCase();
    if (scheduleNumber.endsWith("S")) {
      candidates.add(scheduleNumber);
      candidates.add(`Sch ${scheduleNumber}`);
    } else {
      candidates.add(`Sch ${scheduleNumber}`);
      candidates.add(scheduleNumber);
    }
  }

  const stainlessMatch = upperValue.match(/\b([0-9]+S)\b/);
  if (stainlessMatch?.[1]) {
    candidates.add(stainlessMatch[1].toUpperCase());
    candidates.add(`Sch ${stainlessMatch[1].toUpperCase()}`);
  }

  if (candidates.size === 0 && rawValue) {
    candidates.add(rawValue);
  }

  return Array.from(candidates);
}

function normalizeSchedule(value: string) {
  return value
    .toUpperCase()
    .replace(/\bSCHEDULE\b/g, "SCH")
    .replace(/\bSCH\s+(XS|XXS|STD)\b/g, "$1")
    .replace(/\bSCH\s+([0-9]+S)\b/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function naturalSort(first: string, second: string) {
  return first.localeCompare(second, undefined, { numeric: true, sensitivity: "base" });
}

function toNumber(value: string | number | null | undefined) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}
