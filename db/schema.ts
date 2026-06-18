import {
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const mocDetail = pgTable("mocDetail", {
  id: serial("id").primaryKey(),
  moc: varchar("MOC").notNull().unique(),
  mocName: varchar("MOC_NAME").notNull(),
});

export const jointsDetail = pgTable("jointsDetail", {
  id: serial("id").primaryKey(),
  sizeInches: varchar("SIZE_INCHES"),
  pipeSchedule: varchar("PIPE_SCHEDULE"),
  thickness: integer("THKNESS"),
  shopJoints: integer("SHOP_JOINTS"),
  shopInchDia: integer("SHOP_INCH_DIA"),
  fieldJoints: integer("FIELD_JOINTS"),
  fieldInchDia: integer("FIELD_INCH_DIA"),
  totalJoints: integer("TOTAL_JOINTS"),
  totalInchDia: integer("TOTAL_INCH_DIA"),
  moc: varchar("MOC").notNull().references(() => mocDetail.moc),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  project_name: varchar("project_name").notNull(),
  url: varchar("url").notNull(),
  fileName: varchar("fileName").notNull(),
  category: varchar("category").notNull(),
});

export const progressReports = pgTable("progress_reports", {
  id: serial("id").primaryKey(),
  moc: varchar("moc").notNull().references(() => mocDetail.moc),
  reportDate: date("report_date", { mode: "string" }).notNull(),
  progressScope: varchar("progress_scope", { length: 10 }).notNull(),
  reportNo: varchar("report_no", { length: 80 }),
  remarks: text("remarks"),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }),
});

export const progressLines = pgTable("progress_lines", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => progressReports.id),
  jointRecordId: integer("joint_record_id").notNull().references(() => jointsDetail.id),
  sizeInches: varchar("size_inches"),
  sizeValue: numeric("size_value", { precision: 12, scale: 4 }).notNull(),
  thickness: integer("thickness").notNull(),
  pipeSchedule: varchar("pipe_schedule"),
  scopeJoints: integer("scope_joints").notNull(),
  progressJoints: integer("progress_joints").notNull(),
  progressInchDia: numeric("progress_inch_dia", { precision: 14, scale: 4 }),
  createdAt: timestamp("created_at", { mode: "string", withTimezone: true }),
  updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true }),
});
