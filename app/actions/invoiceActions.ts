
"use server";

import { db } from "../configs/db";
import { partialInvoices } from "../configs/schema";
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