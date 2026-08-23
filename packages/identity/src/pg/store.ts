/**
 * PostgreSQL-backed IdentityStore (runtime app role).
 *
 * Implements the same interface as the in-memory store, plus a DB-backed client
 * registry (`loadClients`) and persisted signing keys (`loadActiveSigningKey`,
 * `otherPublicJwks`) so a restart keeps issuing verifiable tokens and a new
 * module is onboarded by inserting an `oauth_clients` row — not a code change.
 */

import pg from "pg";
import { poolConfig } from "./pool.ts";
import type { JWK } from "jose";
import type {
  AuthCodeRecord,
  IdentityStore,
  StoredMembership,
  StoredOrg,
  StoredRole,
  StoredUser,
} from "../store.ts";
import type { OidcClient } from "../config.ts";
import { signingKeyFromPkcs8, type SigningKey } from "../keys.ts";

export class PgStore implements IdentityStore {
  private pool: pg.Pool;

  constructor(appUrl: string) {
    this.pool = new pg.Pool({ ...poolConfig(appUrl), max: 10 });
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const { rows } = await this.pool.query<UserRow>(
      `select id, email, display_name, status, password_hash from users where lower(email) = lower($1)`,
      [email.trim()],
    );
    return rows[0] ? toUser(rows[0]) : null;
  }

  async findUserById(id: string): Promise<StoredUser | null> {
    const { rows } = await this.pool.query<UserRow>(
      `select id, email, display_name, status, password_hash from users where id = $1`,
      [id],
    );
    return rows[0] ? toUser(rows[0]) : null;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    await this.pool.query(`update users set password_hash = $2 where id = $1`, [id, passwordHash]);
  }

  async membershipsForUser(userId: string): Promise<StoredMembership[]> {
    const { rows } = await this.pool.query<{ org_id: string; role_keys: string[] }>(
      `select org_id, role_keys from memberships where user_id = $1 order by org_id`,
      [userId],
    );
    return rows.map((r) => ({ userId, orgId: r.org_id, roleKeys: r.role_keys ?? [] }));
  }

  async findOrg(id: string): Promise<StoredOrg | null> {
    const org = await this.pool.query<OrgRow>(
      `select id, name, country, is_demo, tier from organizations where id = $1`,
      [id],
    );
    if (!org.rows[0]) return null;
    const les = await this.pool.query(
      `select id, name, registration_number, country from legal_entities where org_id = $1`,
      [id],
    );
    const row = org.rows[0];
    return {
      id: row.id,
      name: row.name,
      country: row.country,
      isDemo: row.is_demo,
      tier: row.tier,
      legalEntities: les.rows.map((e) => ({
        id: e.id,
        name: e.name,
        registrationNumber: e.registration_number,
        country: e.country,
      })),
    };
  }

  async findRole(key: string): Promise<StoredRole | null> {
    const { rows } = await this.pool.query<RoleRow>(
      `select key, label, scope, permissions from roles where key = $1`,
      [key],
    );
    if (!rows[0]) return null;
    return {
      key: rows[0].key,
      label: rows[0].label,
      scope: rows[0].scope as StoredRole["scope"],
      permissions: rows[0].permissions ?? [],
    };
  }

  async saveAuthCode(record: AuthCodeRecord): Promise<void> {
    await this.pool.query(
      `insert into auth_codes (code, client_id, user_id, org_id, redirect_uri, code_challenge, nonce, scope, expires_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,to_timestamp($9/1000.0))`,
      [
        record.code,
        record.clientId,
        record.userId,
        record.orgId,
        record.redirectUri,
        record.codeChallenge,
        record.nonce,
        record.scope,
        record.expiresAt,
      ],
    );
  }

  async takeAuthCode(code: string): Promise<AuthCodeRecord | null> {
    // Single-use: delete and return atomically.
    const { rows } = await this.pool.query<AuthCodeRow>(
      `delete from auth_codes where code = $1
       returning code, client_id, user_id, org_id, redirect_uri, code_challenge, nonce, scope,
                 (extract(epoch from expires_at)*1000)::bigint as expires_at`,
      [code],
    );
    const row = rows[0];
    if (!row) return null;
    const record: AuthCodeRecord = {
      code: row.code,
      clientId: row.client_id,
      userId: row.user_id,
      orgId: row.org_id,
      redirectUri: row.redirect_uri,
      codeChallenge: row.code_challenge,
      nonce: row.nonce,
      scope: row.scope,
      expiresAt: Number(row.expires_at),
    };
    if (record.expiresAt < Date.now()) return null;
    return record;
  }

  // --- Client registry -------------------------------------------------------
  async loadClients(): Promise<OidcClient[]> {
    const { rows } = await this.pool.query<ClientRow>(
      `select client_id, name, client_secret_hash, redirect_uris, post_logout_redirect_uris, audiences from oauth_clients`,
    );
    return rows.map((r) => ({
      clientId: r.client_id,
      name: r.name,
      clientSecretHash: r.client_secret_hash ?? undefined,
      redirectUris: r.redirect_uris ?? [],
      postLogoutRedirectUris: r.post_logout_redirect_uris ?? [],
      audiences: r.audiences ?? [],
    }));
  }

  // --- Signing keys ----------------------------------------------------------
  async loadActiveSigningKey(): Promise<SigningKey> {
    const { rows } = await this.pool.query<KeyRow>(
      `select kid, private_pkcs8, public_jwk from signing_keys where status = 'active' order by created_at desc limit 1`,
    );
    if (!rows[0]) throw new Error("ingen aktiv signeringsnyckel — kör pgBootstrap först");
    return signingKeyFromPkcs8(rows[0].private_pkcs8, { ...rows[0].public_jwk, kid: rows[0].kid });
  }

  /** Public JWKs of keys other than the active one, to keep JWKS valid during rotation. */
  async otherPublicJwks(activeKid: string): Promise<JWK[]> {
    const { rows } = await this.pool.query<{ public_jwk: JWK }>(
      `select public_jwk from signing_keys where kid <> $1`,
      [activeKid],
    );
    return rows.map((r) => r.public_jwk);
  }
}

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  status: string;
  password_hash: string;
}
function toUser(r: UserRow): StoredUser {
  return {
    id: r.id,
    email: r.email,
    displayName: r.display_name,
    status: r.status as StoredUser["status"],
    passwordHash: r.password_hash,
  };
}
interface OrgRow {
  id: string;
  name: string;
  country: string;
  is_demo: boolean;
  tier: string;
}
interface RoleRow {
  key: string;
  label: string;
  scope: string;
  permissions: string[];
}
interface ClientRow {
  client_id: string;
  name: string;
  client_secret_hash: string | null;
  redirect_uris: string[];
  post_logout_redirect_uris: string[];
  audiences: string[];
}
interface KeyRow {
  kid: string;
  private_pkcs8: string;
  public_jwk: JWK;
}
interface AuthCodeRow {
  code: string;
  client_id: string;
  user_id: string;
  org_id: string | null;
  redirect_uri: string;
  code_challenge: string;
  nonce: string | null;
  scope: string;
  expires_at: string | number;
}
