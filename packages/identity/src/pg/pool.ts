import pg from "pg";

/**
 * Build a pg Pool config from a connection string, enabling TLS for remote
 * hosts (managed Postgres such as Neon requires SSL) while leaving local
 * development (localhost/127.0.0.1) on a plain connection. Managed providers
 * present a valid CA, but pooled/proxy hostnames vary, so we do not force strict
 * verification here.
 */
export function poolConfig(connectionString: string): pg.PoolConfig {
  const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(connectionString);
  const wantsSsl = !isLocal || /sslmode=require/i.test(connectionString);
  return wantsSsl ? { connectionString, ssl: { rejectUnauthorized: false } } : { connectionString };
}
