CREATE TABLE IF NOT EXISTS "countries" (
	"country_name" varchar NOT NULL,
	"details" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jointsDetail" (
	"id" serial PRIMARY KEY NOT NULL,
	"SIZE_INCHES" varchar,
	"PIPE_SCHEDULE" varchar,
	"THKNESS" integer,
	"SHOP_JOINTS" integer,
	"SHOP_INCH_DIA" integer,
	"FIELD_JOINTS" integer,
	"FIELD_INCH_DIA" integer,
	"TOTAL_JOINTS" integer,
	"TOTAL_INCH_DIA" integer,
	"MOC" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mocDetail" (
	"id" serial PRIMARY KEY NOT NULL,
	"MOC" varchar NOT NULL,
	"MOC_NAME" varchar NOT NULL,
	CONSTRAINT "mocDetail_MOC_unique" UNIQUE("MOC")
);
--> statement-breakpoint
DROP TABLE "materials";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jointsDetail" ADD CONSTRAINT "jointsDetail_MOC_mocDetail_MOC_fk" FOREIGN KEY ("MOC") REFERENCES "public"."mocDetail"("MOC") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
