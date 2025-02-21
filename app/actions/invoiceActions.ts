
"use server";

import { db } from "../configs/db";
import { partialInvoices, mocs} from "../configs/schema";
import { eq } from "drizzle-orm";

// Type for creating new invoices (all required)
export interface CreatePartialInvoice {
  mocId: number;
  invoiceNo: string;
  invoiceDate: string;
  amount: number;
  vat: number;
  retention: number;
  invoiceStatus: string;
}

// Type for updates (all optional)
export interface UpdatePartialInvoice {
  mocId?: number;
  invoiceNo?: string;
  invoiceDate?: string;
  amount?: number;
  vat?: number;
  retention?: number;
  invoiceStatus?: string;
}

export type PartialInvoiceData = {
  invoiceId: number;
  mocId: number;
  invoiceNo: string;
  invoiceDate: Date;
  amount: number;
  vat: number;
  retention: number;
  invoiceStatus: string;
  mocNo: string | null;
  cwo: string | null;
  po: string | null;
  proposal: string | null;
  contractValue: number | null;
  shortDescription: string | null; // Add this
  type: string | null;
};

export async function getPartialInvoices(): Promise<{
  success: boolean;
  data?: PartialInvoiceData[];
  message?: string;
}> {
  try {
    const rawData = await db
      .select({
        invoiceId: partialInvoices.id,
        mocId: partialInvoices.mocId,
        invoiceNo: partialInvoices.invoiceNo,
        invoiceDate: partialInvoices.invoiceDate,
        amount: partialInvoices.amount,
        vat: partialInvoices.vat,
        retention: partialInvoices.retention,
        invoiceStatus: partialInvoices.invoiceStatus,
        mocNo: mocs.mocNo,
        cwo: mocs.cwo,
        po: mocs.po,
        proposal: mocs.proposal,
        contractValue: mocs.contractValue,
        shortDescription: mocs.shortDescription, // Add this line
        type: mocs.type // Add this line
      })
      .from(partialInvoices)
      .leftJoin(mocs, eq(partialInvoices.mocId, mocs.id));

    const processedData = rawData.map(row => ({
      ...row,
      amount: Number(row.amount),
      vat: Number(row.vat),
      retention: Number(row.retention),
      contractValue: Number(row.contractValue),
      invoiceDate: new Date(row.invoiceDate),
      shortDescription: row.shortDescription, // Add this
    }));

    return { success: true, data: processedData };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function addPartialInvoice(data: CreatePartialInvoice) {
  try {
    const { amount, vat, retention, ...rest } = data;
    const payable = amount + vat - retention;
    await db.insert(partialInvoices).values({
      ...rest,
      amount: amount.toString(),
      vat: vat.toString(),
      retention: retention.toString(),
      payable: payable.toString(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updatePartialInvoice(id: number, data: UpdatePartialInvoice) {
  try {
    const updateData: Record<string, any> = { ...data };
    
    // Only update amount-related fields if amount is provided
    if (data.amount !== undefined || data.vat !== undefined || data.retention !== undefined) {
      const amount = data.amount ?? 0;
      const vat = data.vat ?? 0;
      const retention = data.retention ?? 0;
      const payable = amount + vat - retention;
      
      updateData.amount = amount.toString();
      updateData.vat = vat.toString();
      updateData.retention = retention.toString();
      updateData.payable = payable.toString();
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await db
      .update(partialInvoices)
      .set(updateData)
      .where(eq(partialInvoices.id, id));
      
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deletePartialInvoice(id: number) {
  try {
    await db.delete(partialInvoices).where(eq(partialInvoices.id, id));
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}