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
import { mocs, partialInvoices } from "../configs/schema";
import { eq } from "drizzle-orm";

/** Adds a new MOC record (base details). */
export async function addMOC(data: {
  mocNo: string;
  cwo: string;
  po: string;
  proposal: string;
  contractValue: number;
}) {
  try {
    const result = await db.insert(mocs).values({
      mocNo: data.mocNo,
      cwo: data.cwo,
      po: data.po,
      proposal: data.proposal,
      contractValue: data.contractValue.toString(), // Convert number to string
    }).returning();
    return { success: true, moc: result[0] };
  } catch (error: any) {
    console.error("Error adding MOC:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Adds a new partial invoice for an existing MOC.
 * Payable = amount + vat – retention.
 */
export async function addPartialInvoice(data: {
  mocId: number;
  invoiceNo: string;
  invoiceDate: string; // ISO date (YYYY-MM-DD)
  amount: number;
  vat: number;
  retention: number;
  invoiceStatus: string;
}) {
  try {
    const { amount, vat, retention, ...rest } = data;
    const payable = amount + vat - retention;
    const result = await db
      .insert(partialInvoices)
      .values({
        ...rest,
        amount: amount.toString(),       // Convert number to string
        vat: vat.toString(),             // Convert number to string
        retention: retention.toString(), // Convert number to string
        payable: payable.toString(),     // Convert computed payable to string
      })
      .returning();
    return { success: true, invoice: result[0] };
  } catch (error: any) {
    console.error("Error adding partial invoice:", error);
    return { success: false, message: error.message };
  }
}

/** Updates a partial invoice record. */
export async function updatePartialInvoice(data: {
  id: number;
  mocId: number;
  invoiceNo: string;
  invoiceDate: string;
  amount: number;
  vat: number;
  retention: number;
  invoiceStatus: string;
}) {
  try {
    const { id, amount, vat, retention, ...rest } = data;
    const payable = amount + vat - retention;
    const result = await db
      .update(partialInvoices)
      .set({
        ...rest,
        amount: amount.toString(),       // Convert number to string
        vat: vat.toString(),             // Convert number to string
        retention: retention.toString(), // Convert number to string
        payable: payable.toString(),     // Convert computed payable to string
      })
      .where(eq(partialInvoices.id, id))
      .returning();
    return { success: true, invoice: result[0] };
  } catch (error: any) {
    console.error("Error updating partial invoice:", error);
    return { success: false, message: error.message };
  }
}

/** Deletes a partial invoice record. */
export async function deletePartialInvoice(data: { id: number }) {
  try {
    await db.delete(partialInvoices).where(eq(partialInvoices.id, data.id));
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting partial invoice:", error);
    return { success: false, message: error.message };
  }
}
