import { pgTable, serial, varchar, primaryKey, integer, json } from "drizzle-orm/pg-core";

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