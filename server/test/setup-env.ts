import { resolveTestDatabaseUrl } from './helpers/test-database.js'

// Runs in every test worker before test modules are imported.
process.env.DATABASE_URL = resolveTestDatabaseUrl()
process.env.NODE_ENV = 'test'
