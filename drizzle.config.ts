import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: "postgresql",
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:'postgresql://azcsmohdali1:f1NauxJ0RikY@ep-morning-snowflake-15132543.ap-southeast-1.aws.neon.tech/MOC?sslmode=require'
  },
});
