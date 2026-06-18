import type { JointRecord, JointRecordPayload, MocOption, MocPayload } from "../domain/types";

export async function fetchJointRecords() {
  const response = await fetch("/api/joint-records", { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load joint records.");
  }

  return (payload.data ?? []) as JointRecord[];
}

export async function fetchMocs() {
  const response = await fetch("/api/mocs", { cache: "no-store" });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load MOC list.");
  }

  return (payload.data ?? []) as MocOption[];
}

export async function saveMoc(payload: MocPayload) {
  const response = await fetch("/api/mocs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to save MOC.");
  }

  return data.data as MocOption;
}

export async function createJointRecord(payload: JointRecordPayload) {
  const response = await fetch("/api/joint-records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to create joint record.");
  }

  return data.data as JointRecord;
}

export async function updateJointRecord(id: number, payload: JointRecordPayload) {
  const response = await fetch("/api/joint-records", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...payload }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to update joint record.");
  }

  return data.data as JointRecord;
}

export async function deleteJointRecord(id: number) {
  const response = await fetch(`/api/joint-records?id=${id}`, {
    method: "DELETE",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to delete joint record.");
  }

  return id;
}
