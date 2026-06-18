const INVALID_TEXT_VALUES = new Set(["", "[object object]", "undefined", "null"]);

export function getCleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();
  return INVALID_TEXT_VALUES.has(trimmedValue.toLowerCase()) ? "" : trimmedValue;
}

export function formatFileSize(bytes: number | null | undefined) {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) {
    return "";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** unitIndex;
  const digits = size >= 10 || unitIndex === 0 ? 0 : 1;

  return `${size.toFixed(digits)} ${units[unitIndex]}`;
}
