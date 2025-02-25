import { sql } from 'drizzle-orm';
import { pgTable, serial, varchar, primaryKey, integer, json,timestamp,pgEnum, text,  numeric,} from "drizzle-orm/pg-core";
import { date } from 'drizzle-orm/pg-core'; // Ensure this import is included
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




export const jointSummary = pgTable("jointSummary", {
  id: serial("id").primaryKey(),
  moc: varchar("MOC").notNull().unique(),
  mocName: varchar("MOC_NAME").notNull(),
  
  mocStartDate: date("moc_start_date").notNull(),  // Correctly defined date type
  MCCDate: date("mcc_date").notNull(),              // Correctly defined date type

  totalShopJoints: integer("total_shop_joints").notNull(),
  totalFieldJoints: integer("total_field_joints").notNull(),
  totalJoints: integer("total_joints").notNull(),
  totalShopInchDia: integer("total_shop_inch_dia").notNull(),
  totalFieldInchDia: integer("total_field_inch_dia").notNull(),
  totalInchDia: integer("total_inch_dia").notNull(),
});



// Line Items table
export const jointTable = pgTable("jointTable", {
  id: serial("id").primaryKey(),
  pipeSize: integer("pipe_size").notNull(),
  thk: varchar("thk").notNull(),
  type: varchar("type").notNull(),
  shopJoint: integer("shop_joint").notNull(),
  fieldJoint: integer("field_joint").notNull(),
  totalJoint: integer("total_joint").notNull(),
  shopInchDia: integer("shop_inch_dia").notNull(),
  fieldInchDia: integer("field_inch_dia").notNull(),
  totalInchDia: integer("total_inch_dia").notNull(),
  moc: varchar('MOC').notNull().references(() => jointSummary.moc),  // Foreign key to mocDetail.moc
});


export const mocRecords = pgTable("moc_records", {
  id: serial("id").primaryKey(),
  type: varchar("type").notNull(),
  mocNumber: varchar("moc_number").notNull(),
  smallDescription: varchar("small_description").notNull(),
  mocName: varchar("moc_name").notNull(),
  awardedDate: date("awarded_date").notNull(),
  startDate: date("start_date").notNull(),
  mccDate: date("mcc_date").notNull(),
  value: integer("value").notNull(),
  scope: json("scope").notNull(), // Using JSON for the scope array
  pqrStatus: varchar("pqr_status").notNull(),
  wqtStatus: varchar("wqt_status").notNull(),
  wpsStatus: varchar("wps_status").notNull(),
});


export const customer = pgTable("customer", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
});

// Example schema configuration (e.g., using Drizzle ORM)
export const accountReceivable = pgTable('account_receivable', {
  id: serial('id').primaryKey(),
  date: date("date").notNull(),
  documentNo: varchar('documentno', { length: 256 }).notNull(),
  documentType: varchar('documenttype', { length: 50 }).notNull(),
  description: varchar('description').notNull(),
  amount: integer('amount').notNull(),
  debit: integer('debit'),
  credit: integer('credit'),
  customerId: integer('customerid').references(() => customer.id),
});



// Customers table
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  address: varchar('address', { length: 255 }).notNull(),
});

// Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  itemCode: varchar('item_code', { length: 20 }).notNull().unique(),
  description: varchar('description', { length: 255 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
});

// Invoices table with a foreign key to customers
export const invoice = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 20 }).notNull().unique(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id),
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date').notNull(),
  status: varchar('status', { length: 20 })
    .notNull()
    .default('unpaid'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull(),
});

// Invoice Items table with foreign keys to invoices and products
export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id')
    .notNull()
    .references(() => invoices.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
});

// Settings table
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  companyName: varchar('company_name', { length: 100 }).notNull(),
  companyAddress: varchar('company_address', { length: 255 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull(),
  paymentTerms: varchar('payment_terms', { length: 100 }).notNull(),
});

// Invoice Sequence table
export const invoiceSequence = pgTable('invoice_sequence', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull(),
  sequence: integer('sequence').notNull(),
});


export const mocs = pgTable("mocs", {
  id: serial("id").primaryKey(),
  mocNo: text("moc_no").notNull(),
  cwo: text("cwo").notNull(),
  po: text("po").notNull(),
  proposal: text("proposal").notNull(),
  contractValue: numeric("contract_value", { precision: 12, scale: 2 }).notNull(),
  description: text("description"), // Optional, add .notNull() if required
  shortDescription: varchar("short_description", { length: 255 }), // Optional, add .notNull() if required
  type: text("type").notNull(), // newly added field
  pssrStatus: text("pssr_status"),
  prbStatus: text("prb_status"),
  remarks: text("remarks"),

});

export const partialInvoices = pgTable("partial_invoices", {
  id: serial("id").primaryKey(),
  mocId: integer("moc_id").references(() => mocs.id).notNull(),
  invoiceNo: text("invoice_no").notNull(),
  invoiceDate: date("invoice_date").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  vat: numeric("vat", { precision: 12, scale: 2 }).notNull(),
  retention: numeric("retention", { precision: 12, scale: 2 }).notNull(),
  payable: numeric("payable", { precision: 12, scale: 2 }).notNull(),
  invoiceStatus: text("invoice_status").notNull(),

});
