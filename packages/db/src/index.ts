/**
 * @pixdrift/db — shared Postgres primitives.
 *
 * A pool and a migration runner. Not a schema, not an ORM, not a place for
 * product tables. Each product owns its data (constitution art. 1–2) and
 * brings its own SQL directory; this package only applies files and opens
 * connections the same way everywhere.
 */

export { poolConfig, createPool, type CreatePoolOptions } from "./pool.ts";
export {
  migrate,
  loadMigrations,
  parseMigrationFilename,
  checksumSql,
  grantSchemaAccess,
  quoteIdent,
  MIGRATION_FILENAME,
  MigrationError,
  type MigrationFile,
  type MigrateOptions,
  type MigrateResult,
  type SchemaGrant,
} from "./migrate.ts";
export { migrateWorkspace, WORKSPACE_SCHEMAS, type WorkspaceMigrateOptions } from "./workspace.ts";
