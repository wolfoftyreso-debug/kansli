/**
 * The health model the owner actually reads.
 *
 * An expiring access token is not a problem and must never be reported as one.
 * Only a dead grant produces "action required".
 */

import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import {
  revolutConfigState,
  type Env,
  type KeyMatch,
  type RevolutConfigState,
  type RevolutEnvironment,
} from "./config.ts";
import { readConnection, type ConnectionStatus, type RevolutConnection } from "./connection.ts";
import { logRevolut } from "./observability.ts";
import { REFRESH_MARGIN_MS } from "./tokens.ts";

export type CertificateHealth = "unknown" | "valid" | "expiring" | "expired";

export interface RevolutHealth {
  environment: RevolutEnvironment;
  status: ConnectionStatus;
  configuration: { ok: boolean; missing: string[]; privateKeyError: string | null };
  redirect: RevolutConfigState["redirect"];
  oauthConnected: boolean;
  accessTokenValid: boolean;
  refreshAvailable: boolean;
  automaticRenewal: boolean;
  connectedAt: string | null;
  lastSuccessAt: string | null;
  lastRefreshAt: string | null;
  lastErrorCode: string | null;
  certificate: {
    health: CertificateHealth;
    fingerprint: string | null;
    expiresAt: string | null;
    daysUntilExpiry: number | null;
    keyMatch: KeyMatch;
  };
  actionRequired: boolean;
  /** One Swedish line for a non-developer. */
  summary: string;
}

export function certificateHealth(
  expiresAt: string | null,
  warnDays: number,
  now: Date,
): { health: CertificateHealth; daysUntilExpiry: number | null } {
  if (!expiresAt) return { health: "unknown", daysUntilExpiry: null };
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return { health: "unknown", daysUntilExpiry: null };
  const days = Math.floor((expiry - now.getTime()) / 86_400_000);
  if (days < 0) return { health: "expired", daysUntilExpiry: days };
  if (days <= warnDays) return { health: "expiring", daysUntilExpiry: days };
  return { health: "valid", daysUntilExpiry: days };
}

function summarise(input: {
  configured: boolean;
  status: ConnectionStatus;
  accessTokenValid: boolean;
  refreshAvailable: boolean;
  certificate: CertificateHealth;
  keyMatch: KeyMatch;
}): string {
  // Checked before anything else: a mismatched pair cannot authenticate, and
  // every other symptom downstream of it would be a red herring.
  if (input.keyMatch.state === "mismatch") {
    return "Nyckeln i miljön hör inte till certifikatet hos Revolut.";
  }
  if (input.status === "revoked") return "Inte ansluten. Anslutningen togs bort.";
  if (input.status === "action_required") return "Anslutningen måste göras om i Revolut.";
  if (!input.configured) return "Inte konfigurerad. Certifikat och client id saknas.";
  if (input.status === "pending_authorization") return "Väntar på godkännande i Revolut.";
  if (input.status === "active") {
    if (input.certificate === "expired") return "Ansluten, men certifikatet har gått ut.";
    if (input.certificate === "expiring") return "Ansluten. Certifikatet behöver bytas snart.";
    if (input.refreshAvailable) return "Ansluten. Tokenen förnyas automatiskt.";
    return "Ansluten, men utan refresh token. Anslut om för automatisk förnyelse.";
  }
  return "Inte ansluten.";
}

const WARNING_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * Warns early enough that the certificate can be rotated deliberately instead
 * of during an outage. Deduped to once a day so it does not become wallpaper.
 * Called from write paths only — a page render never publishes events.
 */
export async function warnOnCertificateExpiry(
  events: EventLog,
  orgRef: string,
  health: RevolutHealth,
  now = new Date(),
): Promise<boolean> {
  if (health.certificate.health !== "expiring" && health.certificate.health !== "expired") {
    return false;
  }
  const recent = await events
    .list({
      orgRef,
      kind: "ekonomi.revolut.certificate.expiry_warning",
      order: "desc",
      limit: 1,
    })
    .catch(() => []);
  const last = recent[0];
  if (last && now.getTime() - new Date(last.occurredAt).getTime() < WARNING_COOLDOWN_MS) {
    return false;
  }
  logRevolut("certificate.expiry_warning", {
    orgRef,
    environment: health.environment,
    daysUntilExpiry: health.certificate.daysUntilExpiry,
  });
  await events
    .publish({
      system: "ekonomi",
      kind: "ekonomi.revolut.certificate.expiry_warning",
      orgRef,
      actorKind: "system",
      actorRef: "system",
      subjectRef: `ekonomi:connection:revolut:${health.environment}`,
      payload: {
        title: "Revolut-certifikatet behöver bytas",
        daysUntilExpiry: health.certificate.daysUntilExpiry,
        state: health.certificate.health,
        environment: health.environment,
      },
    })
    .catch(() => undefined);
  return true;
}

export async function revolutHealth(
  db: Pick<pg.Pool, "query">,
  orgRef: string,
  options: { env?: Env; now?: Date } = {},
): Promise<RevolutHealth> {
  const env = options.env ?? process.env;
  const now = options.now ?? new Date();
  const config = revolutConfigState(env);
  const loaded = await readConnection(db, orgRef, config.environment).catch(() => null);
  const connection: RevolutConnection | null = loaded?.connection ?? null;

  const expiresAt = connection?.accessTokenExpiresAt
    ? new Date(connection.accessTokenExpiresAt).getTime()
    : null;
  const accessTokenValid = Boolean(
    loaded?.credentials.accessToken && expiresAt && expiresAt - now.getTime() > REFRESH_MARGIN_MS,
  );
  const refreshAvailable = Boolean(connection?.hasRefreshToken);

  // `refreshing` is derived, not stored: a lock timestamp inside the window we
  // would ever hold one means a refresh is in flight right now.
  const refreshing =
    connection?.refreshLockAt !== null &&
    connection?.refreshLockAt !== undefined &&
    now.getTime() - new Date(connection.refreshLockAt).getTime() < 60_000;

  const stored = connection?.status ?? "not_configured";
  const status: ConnectionStatus =
    stored === "active" && refreshing ? "refreshing" : (stored as ConnectionStatus);

  const cert = certificateHealth(config.certificate.expiresAt, config.certificate.warnDays, now);
  const actionRequired = stored === "action_required" || stored === "revoked";

  return {
    environment: config.environment,
    status,
    configuration: {
      ok: config.ready,
      missing: config.missing,
      privateKeyError: config.privateKeyError,
    },
    redirect: config.redirect,
    oauthConnected: stored === "active",
    accessTokenValid,
    refreshAvailable,
    automaticRenewal: stored === "active" && refreshAvailable && config.ready,
    connectedAt: connection?.connectedAt ?? null,
    lastSuccessAt: connection?.lastSuccessAt ?? null,
    lastRefreshAt: connection?.lastRefreshAt ?? null,
    lastErrorCode: connection?.lastErrorCode ?? null,
    certificate: {
      health: cert.health,
      fingerprint: config.certificate.fingerprint,
      expiresAt: config.certificate.expiresAt,
      daysUntilExpiry: cert.daysUntilExpiry,
      keyMatch: config.keyMatch,
    },
    actionRequired,
    summary: summarise({
      configured: config.ready,
      status,
      accessTokenValid,
      refreshAvailable,
      certificate: cert.health,
      keyMatch: config.keyMatch,
    }),
  };
}
