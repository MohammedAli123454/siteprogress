"use server";

import { db } from "../configs/db";
import { files as filesSchema } from "../configs/schema";
import { put,del } from "@vercel/blob";
import { eq } from "drizzle-orm";

import { invoices,lineItems } from "../configs/schema";



type InvoiceHeader = {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerAddress: string;
  totalQty: number;
  grandTotal: number;
};

type LineItem = {
  itemCode: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
};

type InvoiceData = {
  header: InvoiceHeader;
  lineItems: LineItem[];
};

// Server action to upload files and save their URLs in the database under the specified project name
export async function uploadFiles(formData: FormData) {
  const projectName = formData.get("projectName") as string;
  const uploadedFiles: { url: string }[] = [];  // Array to store uploaded file URLs
  const category = formData.get("category") as string;
  const files = formData.getAll("files") as File[];  // Extract files from the FormData object

 
 

  // Loop through each file and upload to Vercel Blob
  for (const file of files) {
    const stream = file.stream();  // Get the file stream for upload

    // Upload the file to Vercel Blob storage
    const { url } = await put(file.name, stream, {
      access: "public",  // Set the access to public
      token: process.env.IMAGES_TO_BLOB,  // Use the environment variable for the Blob token
    });

    // Push the uploaded file URL to the array
    uploadedFiles.push({ url });

    // Save the file URL and project name in the 'files' table
    await db.insert(filesSchema).values({
      project_name: projectName,  // Insert the project name
      url,  // Insert the file URL
      fileName: file.name,
      category: category,
    });
  }

  // Return an array of uploaded file URLs
  return uploadedFiles;
}

// Server action to delete a file from Vercel Blob and remove its record from the database
export async function deleteFile(fileUrl: string) {
  // Extract the file key from the URL (assuming it's the part after the domain)
  const urlParts = new URL(fileUrl);
  const fileKey = urlParts.pathname.substring(1); // This will give you the file path in blob storage
  
  // Delete the file from Vercel Blob
  await del(fileKey, {
    token: process.env.IMAGES_TO_BLOB,  // Use the environment variable for the Blob token
  });

  // Delete the file record from the database using the file URL
  const deleteResult = await db
    .delete(filesSchema)
    .where(eq(filesSchema.url, fileUrl));
  
  // Inspect deleteResult to determine if rows were affected
  if (deleteResult.rowCount === 0) {  // Adjust according to the actual delete result structure
    throw new Error("File not found in the database.");
  }

  return { success: true, message: "File deleted successfully." };
}


// Save Invoice Function
export async function saveInvoice(data: InvoiceData) {
  const { header, lineItems: items } = data;

  try {
    // Convert date to a Date object for correct timestamp type
    const invoiceHeader = {
      ...header,
      date: new Date(header.date),
    };

    // Insert invoice header and get the full inserted invoice record
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceHeader)
      .returning(); // This returns the full inserted record, including `id`

    // Prepare line items data with the invoice ID
    const lineItemsData = items.map((item) => ({
      ...item,
      invoiceId: invoice.id, // invoice.id is guaranteed by returning the full record
    }));

    // Insert line items
    await db.insert(lineItems).values(lineItemsData);

    return { success: true };
  } catch (error) {
    console.error("Error saving invoice:", error);
    throw new Error("Failed to save invoice");
  }
}