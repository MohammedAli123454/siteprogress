export function parsePipeSize(value: string | number | null | undefined) {
  const rawValue = String(value ?? "")
    .replace(/["']/g, "")
    .replace(/\bin(?:ch(?:es)?)?\b/gi, "")
    .trim();

  if (!rawValue) return 0;

  const normalizedValue = rawValue.replace(/,/g, "");
  const mixedFraction = normalizedValue.match(/^(\d+(?:\.\d+)?)\s*[- ]\s*(\d+)\/(\d+)$/);

  if (mixedFraction) {
    const whole = Number(mixedFraction[1]);
    const numerator = Number(mixedFraction[2]);
    const denominator = Number(mixedFraction[3]);
    return denominator ? whole + numerator / denominator : whole;
  }

  const fraction = normalizedValue.match(/^(\d+)\/(\d+)$/);

  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    return denominator ? numerator / denominator : 0;
  }

  const numericValue = Number.parseFloat(normalizedValue);
  return Number.isFinite(numericValue) ? numericValue : 0;
}
