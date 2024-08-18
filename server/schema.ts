import { pgTable, serial, varchar, integer } from 'drizzle-orm/pg-core';
import { InferModel } from 'drizzle-orm';

// Define the table schema
export const materials = pgTable('materials', {
  id: serial('id').primaryKey(), // Auto-incrementing primary key
  MOC: varchar('MOC', { length: 255 }).notNull(),
  MOCName: varchar('MOCName', { length: 255 }).notNull(),
  Category: varchar('Category', { length: 255 }).notNull(),
  SubCategory: varchar('SubCategory', { length: 255 }).notNull(),
  Description: varchar('Description', { length: 1000 }), // Adjust length as needed
  Size: varchar('Size', { length: 255 }),
  Qty: integer('Qty').notNull(), // Set Qty as an integer
  UOM: varchar('UOM', { length: 255 }),
  LOI: varchar('LOI', { length: 255 }),
  PO: varchar('PO', { length: 255 }),
  MTA: varchar('MTA', { length: 255 }),
  Vendor: varchar('Vendor', { length: 255 }),
  Mfgr: varchar('Mfgr', { length: 255 }),
  NMR601: varchar('NMR601', { length: 255 }),
  NMR602: varchar('NMR602', { length: 255 }),
  NMR603: varchar('NMR603', { length: 255 }),
  FAT: varchar('FAT', { length: 255 }),
  EstimatedDel: varchar('EstimatedDel', { length: 255 }),
  TargetDate: varchar('TargetDate', { length: 255 }),
  Status: varchar('Status', { length: 255 }),
  Remarks: varchar('Remarks', { length: 1000 }) // Adjust length as needed
});

