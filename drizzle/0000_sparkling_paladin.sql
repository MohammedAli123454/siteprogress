CREATE TABLE IF NOT EXISTS "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"MOC" varchar(255) NOT NULL,
	"MOCName" varchar(255) NOT NULL,
	"Category" varchar(255) NOT NULL,
	"SubCategory" varchar(255) NOT NULL,
	"Description" varchar(1000),
	"Size" varchar(255),
	"Qty" integer NOT NULL,
	"UOM" varchar(255),
	"LOI" varchar(255),
	"PO" varchar(255),
	"MTA" varchar(255),
	"Vendor" varchar(255),
	"Mfgr" varchar(255),
	"NMR601" varchar(255),
	"NMR602" varchar(255),
	"NMR603" varchar(255),
	"FAT" varchar(255),
	"EstimatedDel" varchar(255),
	"TargetDate" varchar(255),
	"Status" varchar(255),
	"Remarks" varchar(1000)
);