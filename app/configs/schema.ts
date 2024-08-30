import { pgTable, serial, varchar, primaryKey, integer } from "drizzle-orm/pg-core";

export const mocDetail = pgTable("mocDetail", {
  id: serial('id').primaryKey(),  // Primary key
  moc: varchar('MOC').notNull(),
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
