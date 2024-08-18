import { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv';
// Load environment variables from .env.local (or .env)
dotenv.config({
  path: ".env.local", // or ".env" if you are using a regular .env file
});
export default {
  schema: "./server/schema.ts",
out: "./server/migrations",
  dbCredentials: {
    connectionstring: process.env.DATABASE_URL!,
  },

}