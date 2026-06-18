export type WeldType = "Joints" | "InchDia";

export type NumericValue = number | string | null | undefined;

export type MocSummaryRow = {
  moc: string;
  mocName: string;
  shopJoints: NumericValue;
  fieldJoints: NumericValue;
  totalJoints: NumericValue;
};

export type MocWiseDataRow = {
  MOC: string;
  MOC_NAME: string;
  shopJoints?: NumericValue;
  fieldJoints?: NumericValue;
  totalJoints?: NumericValue;
  shopInchDia?: NumericValue;
  fieldInchDia?: NumericValue;
  totalInchDia?: NumericValue;
};

export type SizeWiseDataRow = {
  SIZE_INCHES: string | null;
  THKNESS: number | null;
  shopJoints?: NumericValue;
  fieldJoints?: NumericValue;
  totalJoints?: NumericValue;
  shopInchDia?: NumericValue;
  fieldInchDia?: NumericValue;
  totalInchDia?: NumericValue;
};
