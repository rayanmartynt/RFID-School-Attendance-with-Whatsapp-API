/** @type { import('drizzle-kit').Config } */
export default {
  schema: './db/schema.js',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:Rayan32136.@localhost:5432/school_attendance'
  }
}
