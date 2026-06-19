export type JointRecord = {
  id: number;
  moc: string;
  mocName: string;
  sizeInches: string;
  pipeSchedule: string;
  thickness: number;
  shopJoints: number;
  fieldJoints: number;
  totalJoints: number;
  shopInchDia: number;
  fieldInchDia: number;
  totalInchDia: number;
};

export type JointRecordFormValues = {
  id: number | null;
  moc: string;
  mocName: string;
  sizeInches: string;
  pipeSchedule: string;
  thickness: number;
  shopJoints: number;
  fieldJoints: number;
};

export type JointRecordPayload = Omit<JointRecordFormValues, "id">;

export type JointRecordBatchCreatePayload = JointRecordPayload & {
  clientId: number;
};

export type JointRecordBatchUpdatePayload = JointRecordPayload & {
  id: number;
};

export type JointRecordBatchPayload = {
  create: JointRecordBatchCreatePayload[];
  update: JointRecordBatchUpdatePayload[];
  deleteIds: number[];
};

export type MocOption = {
  moc: string;
  mocName: string;
};

export type MocPayload = MocOption;
