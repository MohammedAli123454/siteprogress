CREATE TABLE IF NOT EXISTS "jointSummary" (
	"id" serial PRIMARY KEY NOT NULL,
	"MOC" varchar NOT NULL,
	"MOC_NAME" varchar NOT NULL,
	"moc_start_date" date NOT NULL,
	"mcc_date" date NOT NULL,
	"total_shop_joints" integer NOT NULL,
	"total_field_joints" integer NOT NULL,
	"total_joints" integer NOT NULL,
	"total_shop_inch_dia" integer NOT NULL,
	"total_field_inch_dia" integer NOT NULL,
	"total_inch_dia" integer NOT NULL,
	CONSTRAINT "jointSummary_MOC_unique" UNIQUE("MOC")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jointTable" (
	"id" serial PRIMARY KEY NOT NULL,
	"pipe_size" integer NOT NULL,
	"thk" varchar NOT NULL,
	"type" varchar NOT NULL,
	"shop_joint" integer NOT NULL,
	"field_joint" integer NOT NULL,
	"total_joint" integer NOT NULL,
	"shop_inch_dia" integer NOT NULL,
	"field_inch_dia" integer NOT NULL,
	"total_inch_dia" integer NOT NULL,
	"MOC" varchar NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jointTable" ADD CONSTRAINT "jointTable_MOC_jointSummary_MOC_fk" FOREIGN KEY ("MOC") REFERENCES "public"."jointSummary"("MOC") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
