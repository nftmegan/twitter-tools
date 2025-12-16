import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Point to your schema file
  schema: 'prisma/schema.prisma',
  
  // Define the database connection here instead of in the schema
  datasource: {
    url: env('DATABASE_URL'),
  },
  
  // Optional: Configure migrations directory if needed
  migrations: {
    path: 'prisma/migrations',
  },
});