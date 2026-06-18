import { NextResponse } from "next/server";

import {
  createJointRecord,
  deleteJointRecord,
  idSchema,
  jointRecordSchema,
  listJointRecords,
  updateJointRecord,
} from "@/features/joint-inch-dia/data/server-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = await listJointRecords();
    return NextResponse.json({ data: records });
  } catch (error) {
    console.error("Failed to load joint records:", error);
    return NextResponse.json({ error: "Failed to load joint records." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = jointRecordSchema.parse(await request.json());
    const record = await createJointRecord(payload);

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("Failed to create joint record:", error);
    return NextResponse.json({ error: "Failed to create joint record." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = idSchema.parse(body.id);
    const payload = jointRecordSchema.parse(body);
    const record = await updateJointRecord(id, payload);

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Failed to update joint record:", error);
    return NextResponse.json({ error: "Failed to update joint record." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = idSchema.parse(searchParams.get("id"));

    await deleteJointRecord(id);
    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Failed to delete joint record:", error);
    return NextResponse.json({ error: "Failed to delete joint record." }, { status: 400 });
  }
}
