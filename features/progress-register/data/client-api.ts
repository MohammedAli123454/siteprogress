import type { ProgressRegisterRow, ProgressReportPayload } from "../domain/types";

export async function fetchProgressRegisterRows() {
  const response = await fetch("/api/progress-register", { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load progress register.");
  }

  return (payload.data ?? []) as ProgressRegisterRow[];
}

export async function saveProgressReport(payload: ProgressReportPayload) {
  const response = await fetch("/api/progress-register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to save progress report.");
  }

  return data.data as { id: number; savedLineCount: number };
}
