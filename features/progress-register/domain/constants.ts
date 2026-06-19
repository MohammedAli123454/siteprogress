export const ALL_MOCS = "ALL_MOCS";

export const PROGRESS_SCOPE_OPTIONS = [
  {
    value: "SHOP",
    label: "Shop Weld Joint Progress",
    detail: "Fabrication progress by joint count",
  },
  {
    value: "FIELD",
    label: "Field Weld Joints Progress",
    detail: "Site installation progress by joint count",
  },
] as const;
