import { pgTable, serial, text, varchar, integer, doublePrecision } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const MOC = pgTable('moc', {
  id: serial('id').primaryKey(),
  moc: varchar('moc', { length: 255 }).notNull(),
  moc_name: varchar('moc_name', { length: 255 }).notNull()
});

export const JointsDetail = pgTable('joints_detail', {
  id: serial('id').primaryKey(),
  size_inches: doublePrecision('size_inches').notNull(),
  pipe_schedule: varchar('pipe_schedule', { length: 255 }).notNull(),
  thickness: varchar('thickness', { length: 255 }).notNull(),
  shop_joints: integer('shop_joints').notNull(),
  shop_inch_dia: doublePrecision('shop_inch_dia').notNull(),
  field_joints: integer('field_joints').notNull(),
  field_inch_dia: doublePrecision('field_inch_dia').notNull(),
  total_joints: integer('total_joints').notNull(),
  total_inch_dia: doublePrecision('total_inch_dia').notNull(),
  moc_id: integer('moc_id').references(() => MOC.id)
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL // Ensure you set this environment variable
});

export const db = drizzle(pool);
