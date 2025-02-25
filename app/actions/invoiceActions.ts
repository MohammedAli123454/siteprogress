
"use server";

import { db } from "../configs/db";
import { partialInvoices, mocs } from "../configs/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { z } from 'zod';

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


// ==========================
// Type Definitions
// ==========================

// Represents the raw invoice data as fetched from the database.
// Since database fields are often stored as strings, we define them as strings here.
export interface RawInvoice {
  invoiceId: string;
  invoiceNo: string;
  invoiceDate: string;
  amount: string;
  vat: string;
  retention: string;
  invoiceStatus: string;  // Removed MOC-specific fields
}

// Represents the raw MOC (Management of Change) data fetched from the database.
// The invoices field may be either an array or a JSON string, requiring transformation.
export interface RawGroupedMOC {
  mocId: string;
  mocNo: string | null;
  shortDescription: string | null;
  cwo: string | null;
  po: string | null;
  proposal: string | null;
  contractValue: string | null;
  type: string | null;
  invoices: RawInvoice[] | string;
  pssrStatus: string;
  prbStatus: string;
  remarks: string;
}

// Represents an invoice after transforming raw database data into the correct types.
export interface Invoice {
  invoiceId: number;
  invoiceNo: string;
  invoiceDate: Date;
  amount: number;
  vat: number;
  retention: number;
  invoiceStatus: string;  // No MOC fields here
}

// Represents an MOC after transforming raw database data into the correct types.
export interface GroupedMOC {
  mocId: number;
  mocNo: string | null;
  shortDescription: string | null;
  cwo: string | null;
  po: string | null;
  proposal: string | null;
  contractValue: number | null;
  type: string | null;
  invoices: Invoice[];
  pssrStatus: string;    // MOC-specific fields
  prbStatus: string;
  remarks: string;
}

// Defines the structure of API responses.
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; message: string };

// ==========================
// Data Validation Schema
// ==========================

// Zod schema to validate and transform raw invoice data from the database.
// This ensures numerical fields are properly converted to numbers and dates.
const InvoiceSchema = z.object({
  invoiceId: z.union([z.string(), z.number()]).transform(Number),
  invoiceNo: z.string(),
  invoiceDate: z.union([z.string(), z.number()]).transform(v => new Date(v)),
  amount: z.union([z.string(), z.number()]).transform(Number),
  vat: z.union([z.string(), z.number()]).transform(Number),
  retention: z.union([z.string(), z.number()]).transform(Number),
  invoiceStatus: z.string()

});

// ==========================
// Server Action: Fetching Grouped MOCs
// ==========================
export async function getGroupedMOCs(): Promise<ApiResponse<GroupedMOC[]>> {
  try {
    // Execute the SQL query to fetch MOC and Invoice data
    const { rows } = await db.execute(sql`
      SELECT
        m.id AS "mocId",
        m.moc_no AS "mocNo",
        m.short_description AS "shortDescription",
        m.cwo,
        m.po,
        m.proposal,
        m.contract_value AS "contractValue",
        m.type,
         m.pssr_status AS "pssrStatus",
        m.prb_status AS "prbStatus",
        m.remarks AS "remarks",
        COALESCE(
          json_agg(
            json_build_object(
              'invoiceId', p.id::text,
              'invoiceNo', p.invoice_no,
              'invoiceDate', p.invoice_date::text,
              'amount', p.amount::text,
              'vat', p.vat::text,
              'retention', p.retention::text,
              'invoiceStatus', p.invoice_status
            ) ORDER BY p.invoice_date DESC
          ) FILTER (WHERE p.id IS NOT NULL), '[]'
        ) AS "invoices"
  FROM mocs m
      LEFT JOIN partial_invoices p ON m.id = p.moc_id
      GROUP BY 
        m.id, m.moc_no, m.short_description, 
        m.cwo, m.po, m.proposal, 
        m.contract_value, m.type,
        m.pssr_status, m.prb_status, m.remarks
    `);
    // Cast rows to RawGroupedMOC for processing
    const rawData = rows as unknown as RawGroupedMOC[];

    // Process each MOC and convert it to the correct format
    const processedData: GroupedMOC[] = rawData.map(moc => {
      // Parse invoices (handle string or array format)
      let rawInvoices: unknown[] = [];
      try {
        rawInvoices = typeof moc.invoices === 'string'
          ? JSON.parse(moc.invoices) // Convert JSON string to array
          : moc.invoices || []; // Use array directly if already in correct format
      } catch (error) {
        console.error(`Invoice parsing error for MOC ${moc.mocId}:`, error);
      }

      // Validate and process invoices using the Zod schema
      // Since invoices are an array of objects, we must validate each invoice individually.
      // This is why we apply the schema within a map function.
      const invoices = rawInvoices
        .map(rawInvoice => {
          try {
            return InvoiceSchema.parse(rawInvoice); // Convert to correct types
          } catch (error) {
            console.error('Invalid invoice format:', rawInvoice);
            return null; // Exclude invalid invoices
          }
        })
        .filter((invoice): invoice is Invoice => invoice !== null); // Filter out null values

      return {
        mocId: Number(moc.mocId), // Convert string to number
        mocNo: moc.mocNo,
        shortDescription: moc.shortDescription,
        cwo: moc.cwo,
        po: moc.po,
        proposal: moc.proposal,

        // Convert contract value from string to number
        // Unlike invoices, this is a single field, so we apply transformation directly.
        // We do not use a Zod schema here because it is a straightforward conversion.
        contractValue: moc.contractValue ? parseFloat(moc.contractValue) : null,
        type: moc.type,
        pssrStatus: moc.pssrStatus, 
    prbStatus: moc.prbStatus,
    remarks: moc.remarks,
    invoices
         // Processed and validated invoices
      };
    });

    // Filter out MOCs that have neither contract value nor invoices
    const filteredData = processedData.filter(moc =>
      moc.contractValue !== null || moc.invoices.length > 0
    );

    return {
      success: true,
      data: filteredData
    };

  } catch (error) {
    // Handle errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch MOC data';
    console.error('Server Action Error:', { error, timestamp: new Date().toISOString() });
    return {
      success: false,
      message: errorMessage
    };
  }
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