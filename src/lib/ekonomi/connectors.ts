import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { readConnectorEnv, railSnapshot } from "./rails.ts";

export const CONNECTORS = ["revolut_business", "revolut_merchant", "stripe", "swish"] as const;
export type ConnectorId = (typeof CONNECTORS)[number];

export const CONNECTOR_ENV_KEY: Record<ConnectorId, string> = {
  revolut_business: "REVOLUT_BUSINESS_TOKEN",
  revolut_merchant: "REVOLUT_MERCHANT_SECRET",
  stripe: "STRIPE_SECRET_KEY",
  swish: "SWISH_PAYEE_ALIAS",
};

export interface ConnectorSlot {
  provider: ConnectorId;
  envKey: string;
  last4: string | null;
  hasSecret: boolean;
  envPresent: boolean;
  updatedAt: string | null;
}

function wrapKey(): Buffer | null {
  const raw = process.env.EKONOMI_WRAP_KEY?.trim() || process.env.APP_SESSION_SECRET?.trim();
  if (!raw) return null;
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plain: string): { ciphertext: string; last4: string } {
  const key = wrapKey();
  if (!key) throw new Error("EKONOMI_WRAP_KEY or APP_SESSION_SECRET is required to save a key.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([iv, tag, encrypted]).toString("base64"),
    last4: plain.slice(-4),
  };
}

export function decryptSecret(ciphertext: string): string {
  const key = wrapKey();
  if (!key) throw new Error("No wrap key.");
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function last4Of(value: string | null | undefined): string | null {
  if (!value || value.length < 4) return null;
  return value.slice(-4);
}

export async function listConnectorSlots(pool: pg.Pool, orgRef: string): Promise<ConnectorSlot[]> {
  const { rows } = await pool.query(
    `select provider, last4, env_key, updated_at, ciphertext is not null as stored
       from ekonomi.connectors where org_ref = $1`,
    [orgRef],
  );
  const byProvider = new Map(rows.map((row) => [row.provider as ConnectorId, row]));
  const env = readConnectorEnv();
  const envPresent: Record<ConnectorId, boolean> = {
    revolut_business: Boolean(env.revolutBusiness),
    revolut_merchant: Boolean(env.revolutMerchant),
    stripe: Boolean(env.stripeKey),
    swish: Boolean(env.swishPayee),
  };
  return CONNECTORS.map((provider) => {
    const row = byProvider.get(provider);
    return {
      provider,
      envKey: CONNECTOR_ENV_KEY[provider],
      last4: row?.last4 ?? (envPresent[provider] ? "env" : null),
      hasSecret: Boolean(row?.stored) || envPresent[provider],
      envPresent: envPresent[provider],
      updatedAt: row?.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
  });
}

export async function saveConnectorSecret(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  provider: ConnectorId;
  secret: string;
  requestId: string;
}): Promise<ConnectorSlot> {
  const secret = input.secret.trim();
  if (secret.length < 8) throw new Error("The key is too short to be real.");
  const wrapped = encryptSecret(secret);
  await input.pool.query(
    `insert into ekonomi.connectors (org_ref, provider, ciphertext, last4, env_key)
     values ($1,$2,$3,$4,$5)
     on conflict (org_ref, provider) do update
       set ciphertext = excluded.ciphertext,
           last4 = excluded.last4,
           updated_at = now()`,
    [
      input.orgRef,
      input.provider,
      wrapped.ciphertext,
      wrapped.last4,
      CONNECTOR_ENV_KEY[input.provider],
    ],
  );
  await input.events.publish({
    system: "ekonomi",
    kind: "ekonomi.connector.configured",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `ekonomi:connector:${input.provider}`,
    requestId: input.requestId,
    payload: { title: input.provider, last4: wrapped.last4 },
  });
  const slots = await listConnectorSlots(input.pool, input.orgRef);
  return slots.find((slot) => slot.provider === input.provider)!;
}

export async function readConnectorSecret(
  pool: pg.Pool,
  orgRef: string,
  provider: ConnectorId,
): Promise<string | null> {
  const { rows } = await pool.query<{ ciphertext: string | null }>(
    `select ciphertext from ekonomi.connectors where org_ref = $1 and provider = $2`,
    [orgRef, provider],
  );
  if (rows[0]?.ciphertext) return decryptSecret(rows[0].ciphertext);
  const env = readConnectorEnv();
  if (provider === "revolut_business") return env.revolutBusiness;
  if (provider === "revolut_merchant") return env.revolutMerchant;
  if (provider === "stripe") return env.stripeKey;
  if (provider === "swish") return env.swishPayee;
  return null;
}

export function publicRailBoard() {
  return railSnapshot();
}
