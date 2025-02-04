"use server";

import { db } from "@/app/configs/db";
import { accountReceivable, customer } from "@/app/configs/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import { Entry } from "@/lib/schemas";

export async function getEntries(pageParam: number) {
  const limit = 5;
  const offset = pageParam * limit;
  const data = await db
    .select({
      id: accountReceivable.id,
      date: accountReceivable.date,
      customerId: accountReceivable.customerId,
      documentNo: accountReceivable.documentNo,
      documentType: accountReceivable.documentType,
      description: accountReceivable.description,
      amount: accountReceivable.amount,
    })
    .from(accountReceivable)
    .orderBy(accountReceivable.id)
    .limit(limit)
    .offset(offset);

  return data.map((entry) => ({
    ...entry,
    date: entry.date ? new Date(entry.date.toString()) : new Date(),
    customerId: entry.customerId?.toString() || "",
    documentno: entry.documentNo,
    documenttype: entry.documentType as "Invoice" | "Receipt",
  }));
}

export async function getCustomers() {
  const data = await db.select({ label: customer.name, value: customer.id }).from(customer);
  return data.map((c) => ({ label: c.label, value: c.value.toString() }));
}

export async function addEntry(entry: Omit<Entry, "id">) {
  await db.insert(accountReceivable).values({
    date: format(entry.date, "yyyy-MM-dd"),
    documentNo: entry.documentno,
    documentType: entry.documenttype,
    description: entry.description,
    amount: entry.amount,
    debit: entry.documenttype === "Invoice" ? entry.amount : 0,
    credit: entry.documenttype === "Receipt" ? entry.amount : 0,
    customerId: Number(entry.customerId),
  });
}

export async function updateEntry(entry: Entry) {
  await db
    .update(accountReceivable)
    .set({
      date: format(entry.date, "yyyy-MM-dd"),
      documentNo: entry.documentno,
      documentType: entry.documenttype,
      description: entry.description,
      amount: entry.amount,
      debit: entry.documenttype === "Invoice" ? entry.amount : 0,
      credit: entry.documenttype === "Receipt" ? entry.amount : 0,
      customerId: Number(entry.customerId),
    })
    .where(eq(accountReceivable.id, entry.id!));
}

export async function deleteEntry(id: number) {
  await db.delete(accountReceivable).where(eq(accountReceivable.id, id));
}