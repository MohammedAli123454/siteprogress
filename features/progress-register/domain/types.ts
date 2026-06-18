export type ProgressScope = "SHOP" | "FIELD";

export type ProgressRegisterRow = {
  jointRecordId: number;
  moc: string;
  mocName: string;
  sizeInches: string;
  pipeSchedule: string;
  thickness: number;
  shopJoints: number;
  fieldJoints: number;
  shopProgressJoints: number;
  fieldProgressJoints: number;
};

export type ProgressEntryLine = {
  jointRecordId: number;
  progressJoints: number;
};

export type ProgressReportPayload = {
  moc: string;
  progressScope: ProgressScope;
  reportDate: string;
  reportNo?: string;
  remarks?: string;
  lines: ProgressEntryLine[];
};

export type ProgressTotals = {
  scopeJoints: number;
  scopeInchDia: number;
  previousJoints: number;
  newProgressJoints: number;
  totalDoneJoints: number;
  balanceJoints: number;
  newProgressInchDia: number;
  totalDoneInchDia: number;
};

export type MocProgressSummary = ProgressTotals & {
  moc: string;
  mocName: string;
};
