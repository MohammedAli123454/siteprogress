import { sql } from 'drizzle-orm';
import { pgTable, serial, varchar, primaryKey, integer, json,timestamp} from "drizzle-orm/pg-core";

export const mocDetail = pgTable("mocDetail", {
  id: serial('id').primaryKey(),  // Primary key
  moc: varchar('MOC').notNull().unique(),  // Add unique constraint here
  mocName: varchar('MOC_NAME').notNull(),
});

export const jointsDetail = pgTable("jointsDetail", {
  id: serial('id').primaryKey(),  // Primary key
  sizeInches: varchar('SIZE_INCHES'),
  pipeSchedule: varchar('PIPE_SCHEDULE'),
  thickness: integer('THKNESS'),
  shopJoints: integer('SHOP_JOINTS'),
  shopInchDia: integer('SHOP_INCH_DIA'),
  
  fieldJoints: integer('FIELD_JOINTS'),
  fieldInchDia: integer('FIELD_INCH_DIA'),
  totalJoints: integer('TOTAL_JOINTS'),
  totalInchDia: integer('TOTAL_INCH_DIA'),
  moc: varchar('MOC').notNull().references(() => mocDetail.moc),  // Foreign key to mocDetail.moc
});

export const countries = pgTable("countries", {
  countryName: varchar("country_name").notNull(),
  details: json("details").notNull(),
});

export const files = pgTable('files', {
  id: serial('id').primaryKey(),  // Primary key
  project_name: varchar('project_name').notNull(),
  url: varchar('url').notNull(),
  fileName: varchar('fileName').notNull(),
  category: varchar('category').notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number").notNull(),
  date: timestamp("date").default(sql`NOW()`),
  customerName: varchar("customer_name").notNull(),
  customerAddress: varchar("customer_address").notNull(),
  totalQty: integer("total_qty").notNull(),
  grandTotal: integer("grand_total").notNull(),
});

export const lineItems = pgTable("line_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  itemCode: varchar("item_code").notNull(),
  description: varchar("description").notNull(),
  qty: integer("qty").notNull(),
  unit: varchar("unit").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
});