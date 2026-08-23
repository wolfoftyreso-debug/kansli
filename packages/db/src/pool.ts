import pg from "pg";

export interface CreatePoolOptions {
  /** Max clients in the pool. Default 10. */
  max?: number;
  /** Per-statement timeout in milliseconds. Default 15_000. */
  statementTimeoutMs?: number;
  /** How the process identifies itself in pg_stat_activity. */
  applicationName?: string;
}

/**
 * Build a pg Pool config from a connection string, enabling TLS for remote
 * hosts (managed Postgres such as Neon requires SSL) while leaving local
 * development (localhost/127.0.0.1) on a plain connection. Managed providers
 * present a valid CA, but pooled/proxy hostnames vary, so we do not force
 * strict verification here.
 */
export function poolConfig(
  connectionString: string,
  options: CreatePoolOptions = {},
): pg.PoolConfig {
  const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(connectionString);
  const wantsSsl = !isLocal || /sslmode=require/i.test(connectionString);
  const config: pg.PoolConfig = wantsSsl
    ? { connectionString, ssl: { rejectUnauthorized: false } }
    : { connectionString };
  if (options.max !== undefined) config.max = options.max;
  if (options.statementTimeoutMs !== undefined) {
    config.statement_timeout = options.statementTimeoutMs;
    config.query_timeout = options.statementTimeoutMs;
  }
  if (options.applicationName) config.application_name = options.applicationName;
  return config;
}

export function createPool(connectionString: string, options: CreatePoolOptions = {}): pg.Pool {
  const pool = new pg.Pool({
    ...poolConfig(connectionString, options),
    max: options.max ?? 10,
    connectionTimeoutMillis: 5_000,
  });
  // An idle client that dies must not take the process down.
  pool.on("error", () => undefined);
  return pool;
}
