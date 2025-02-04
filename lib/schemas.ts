import { z } from "zod";
export const DOCUMENT_TYPES = ["Invoice", "Receipt"] as const;
export const entrySchema = z.object({
    id: z.number().optional(),
    date: z.date(),
    customerId: z.string().min(1, "Customer is required"),
    documentno: z.string().min(1, "Document No is required"),
    documenttype: z.enum(DOCUMENT_TYPES),
    description: z.string().min(1, "Description is required"),
    amount: z.number().positive("Amount must be positive"),
  });
  
  export type Entry = z.infer<typeof entrySchema>;