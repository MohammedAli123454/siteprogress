CREATE TABLE IF NOT EXISTS "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar NOT NULL,
	"date" timestamp DEFAULT NOW(),
	"customer_name" varchar NOT NULL,
	"customer_address" varchar NOT NULL,
	"total_qty" integer NOT NULL,
	"grand_total" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"item_code" varchar NOT NULL,
	"description" varchar NOT NULL,
	"qty" integer NOT NULL,
	"unit" varchar NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "line_items" ADD CONSTRAINT "line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
