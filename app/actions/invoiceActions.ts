// 'use server';
// import { db } from "../configs/db";
// import { eq, sql } from 'drizzle-orm';
// import {
//   customers,
//   products,
//   invoice,
//   invoiceItems,
//   settings,
//   invoiceSequence,
// } from "../configs/schema";
// import { revalidatePath } from 'next/cache';

// /**
//  * Creates a new invoice and its associated invoice items.
//  * The operation is performed in a single transaction.
//  */
// export async function createInvoice(formData: FormData) {
//     return db.transaction(async (tx) => {
//       const currentYear = new Date().getFullYear();
  
//       // Update or insert into the invoice_sequence table (assuming that works correctly)
//       const sequenceResult = await tx
//         .insert(invoiceSequence)
//         .values({ year: currentYear, sequence: 1 })
//         .onConflictDoUpdate({
//           target: invoiceSequence.year,
//           set: { sequence: sql`${invoiceSequence.sequence} + 1` },
//           where: eq(invoiceSequence.year, currentYear),
//         })
//         .returning();
  
//       const sequenceNumber = sequenceResult[0].sequence;
//       const invoiceNumber = `INV-${currentYear}-${sequenceNumber
//         .toString()
//         .padStart(5, '0')}`;
  
//       // Insert the invoice record using correct types
//       const invoiceResult = await tx
//         .insert(invoice)
//         .values({
//             invoiceNumber,
//           customerId: Number(formData.get('customerId')),
//           issueDate: formData.get('issueDate') as string, // Use string date
//           dueDate: formData.get('dueDate') as string,       // Use string date
//           taxRate: Number(formData.get('taxRate')),
//           totalAmount: Number(formData.get('totalAmount')),
//         })
//         .returning();
  
//       const newInvoice = invoiceResult[0];
  
//       // Parse the items from the form data and insert each invoice item
//       const items = JSON.parse(formData.get('items') as string);
//       await tx.insert(invoiceItems).values(
//         items.map((item: any) => ({
//           invoiceId: newInvoice.id,
//           productId: item.productId,
//           quantity: item.quantity,
//           price: item.price,
//         }))
//       );
  
//       return newInvoice;
//     });
//   }

// /** Retrieves all products from the database */
// export async function getProducts() {
//   return db.select().from(products).all();
// }

// /** Retrieves all customers from the database */
// export async function getCustomers() {
//   return db.select().from(customers).all();
// }

// /** Retrieves the company settings (assuming only one row exists) */
// export async function getSettings() {
//   return db.select().from(settings).limit(1).then((results) => results[0]);
// }

// /app/server-actions/invoiceActions.ts
"use server";

import { db } from "../configs/db";
import { partialInvoices } from "../configs/schema";
import { eq } from "drizzle-orm";

export interface PartialInvoiceBase {
  mocId: number;
  invoiceNo: string;
  invoiceDate: string;  // Only string type here
  amount: number;
  vat: number;
  retention: number;
  invoiceStatus: string;
}

export async function addPartialInvoice(data: PartialInvoiceBase) {
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

export async function updatePartialInvoice(id: number, data: PartialInvoiceBase) {
  try {
    const { amount, vat, retention, ...rest } = data;
    const payable = amount + vat - retention;
    await db
      .update(partialInvoices)
      .set({
        ...rest,
        amount: amount.toString(),
        vat: vat.toString(),
        retention: retention.toString(),
        payable: payable.toString(),
      })
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