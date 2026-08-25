export function appDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL ?? process.env.PIXDRIFT_TEST_DATABASE_URL;
}

export function ownerDatabaseUrl(): string | undefined {
  return process.env.PIXDRIFT_DB_OWNER_URL ?? process.env.PIXDRIFT_TEST_OWNER_URL;
}

export function ritaEngineConfig(): { baseUrl: string; token: string } | null {
  const baseUrl = process.env.RITA_ENGINE_URL;
  const token = process.env.RITA_ENGINE_TOKEN;
  if (!baseUrl || !token) return null;
  return { baseUrl, token };
}
