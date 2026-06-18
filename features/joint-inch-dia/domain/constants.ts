import type { MocPayload } from "./types";

export const ALL_MOCS = "__all_mocs__";

export const emptyMocValues: MocPayload = {
  moc: "",
  mocName: "",
};

export const pipeExportColumns = [
  "Size",
  "Thk",
  "Schedule",
  "Shop Joints",
  "Field Joints",
  "Total Joints",
  "Shop Inch Dia",
  "Field Inch Dia",
  "Total Inch Dia",
];
