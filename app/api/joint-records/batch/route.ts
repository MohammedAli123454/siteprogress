import { NextResponse } from "next/server";

import {
  JointRecordBatchValidationError,
  jointRecordBatchSchema,
  saveJointRecordBatch,
} from "@/features/joint-inch-dia/data/server-data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = jointRecordBatchSchema.parse(await request.json());
    const records = await saveJointRecordBatch(payload);

    return NextResponse.json({ data: records });
  } catch (error) {
    if (error instanceof JointRecordBatchValidationError) {
      return NextResponse.json(
        {
          error: error.message,
          rowErrors: error.rowErrors,
        },
        { status: 409 }
      );
    }

    console.error("Failed to save BOQ batch:", error);
    return NextResponse.json({ error: "Failed to save BOQ changes." }, { status: 400 });
  }
}
