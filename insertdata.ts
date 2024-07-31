import { config } from 'dotenv';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './app/db/schema';
import data from "@/app/data.json" assert { type: 'json' };

// Load environment variables from .env.local
config({ path: './.env.local' });

const main = async () => {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    console.log("Connection string:", connectionString);

    const client = new Client({ connectionString });
    await client.connect();

    const db = drizzle(client);
    const mocMap = new Map();

    for (const item of data) {
      const { MOC: moc, "MOC NAME": moc_name } = item;
      if (!mocMap.has(moc)) {
        console.log(`Inserting MOC: ${moc}, MOC NAME: ${moc_name}`);
        const result = await db.insert(schema.MOC).values({ moc, moc_name }).returning();
        console.log(`Inserted MOC ID: ${result[0].id}`);
        mocMap.set(moc, result[0].id);
      }
    }

    for (const item of data) {
      const { "SIZE (INCHES)": size_inches, "PIPE SCHEDULE": pipe_schedule, THKNESS: thickness, "SHOP JOINTS": shop_joints, "SHOP INCH DIA": shop_inch_dia, "FIELD JOINTS": field_joints, "FIELD INCH DIA": field_inch_dia, "TOTAL JOINTS": total_joints, "TOTAL INCH DIA": total_inch_dia, MOC: moc } = item;
      console.log(`Inserting JointsDetail for MOC: ${moc}`);
      await db.insert(schema.JointsDetail).values({
        size_inches,
        pipe_schedule,
        thickness,
        shop_joints,
        shop_inch_dia,
        field_joints,
        field_inch_dia,
        total_joints,
        total_inch_dia,
        moc_id: mocMap.get(moc)
      });
      console.log(`Inserted JointsDetail for MOC: ${moc}`);
    }

    console.log("Data uploaded successfully");
    await client.end();
  } catch (error) {
    console.error("Error uploading data:", error);
    throw new Error("Failed to seed database");
  }
};

main();
