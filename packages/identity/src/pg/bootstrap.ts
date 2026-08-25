/**
 * Owner-side bootstrap: apply schema + grants, seed the role catalogue and demo
 * tenant, upsert the client registry, and ensure an active signing key exists.
 * Run with the owner connection (never the app role). Idempotent.
 */

import pg from "pg";
import { exportPKCS8 } from "jose";
import { hashPassword } from "@pixdrift/auth-core";
import { SCHEMA_SQL, grantsSql } from "./schema.ts";
import { poolConfig } from "@pixdrift/db";
import { SEED_ROLES } from "../store.ts";
import { generateSigningKey } from "../keys.ts";
import type { OidcClient } from "../config.ts";

export interface BootstrapOptions {
  ownerUrl: string;
  appRole?: string;
  /** Client-registry rows to ensure (upsert). */
  clients?: OidcClient[];
  /** Seed the demo org/user/memberships (default true). */
  seedDemo?: boolean;
}

export async function pgBootstrap(opts: BootstrapOptions): Promise<void> {
  const pool = new pg.Pool(poolConfig(opts.ownerUrl));
  try {
    await pool.query(SCHEMA_SQL);
    await pool.query(grantsSql(opts.appRole ?? "pixdrift_app"));

    for (const role of SEED_ROLES) {
      await pool.query(
        `insert into roles (key, label, scope, permissions) values ($1,$2,$3,$4::jsonb)
         on conflict (key) do update set label = excluded.label, scope = excluded.scope, permissions = excluded.permissions`,
        [role.key, role.label, role.scope, JSON.stringify(role.permissions)],
      );
    }

    if (opts.seedDemo !== false) await seedDemo(pool);

    for (const client of opts.clients ?? []) {
      await pool.query(
        `insert into oauth_clients
           (client_id, name, client_secret_hash, redirect_uris, post_logout_redirect_uris, audiences)
         values ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb)
         on conflict (client_id) do update set
           name = excluded.name,
           client_secret_hash = excluded.client_secret_hash,
           redirect_uris = excluded.redirect_uris,
           post_logout_redirect_uris = excluded.post_logout_redirect_uris,
           audiences = excluded.audiences`,
        [
          client.clientId,
          client.name,
          client.clientSecretHash ?? null,
          JSON.stringify(client.redirectUris),
          JSON.stringify(client.postLogoutRedirectUris ?? []),
          JSON.stringify(client.audiences ?? []),
        ],
      );
    }

    await ensureSigningKey(pool);
  } finally {
    await pool.end();
  }
}

async function seedDemo(pool: pg.Pool): Promise<void> {
  await pool.query(
    `insert into organizations (id, name, country, is_demo, tier) values
       ('org-exempelbolaget','Exempelbolaget AB','SE',true,'enterprise'),
       ('org-nordvik','Nordvik Verkstad AB','SE',true,'enterprise')
     on conflict (id) do update set tier = excluded.tier`,
  );
  await pool.query(
    `insert into legal_entities (id, org_id, name, registration_number, country) values
       ('le-exempelbolaget','org-exempelbolaget','Exempelbolaget AB','5560000000','SE'),
       ('le-nordvik','org-nordvik','Nordvik Verkstad AB','5569999999','SE')
     on conflict (id) do nothing`,
  );
  const existing = await pool.query(`select 1 from users where id = 'user-demo'`);
  if (existing.rowCount === 0) {
    const passwordHash = await hashPassword("demo-losenord-1234");
    await pool.query(
      `insert into users (id, email, display_name, status, password_hash)
       values ('user-demo','demo@exempelbolaget.se','Demo Demosson','active',$1)`,
      [passwordHash],
    );
  }
  await pool.query(
    `insert into memberships (id, user_id, org_id, role_keys) values
       ('m-demo-exempel','user-demo','org-exempelbolaget','["orgOwner"]'::jsonb),
       ('m-demo-nordvik','user-demo','org-nordvik','["orgMember"]'::jsonb)
     on conflict (user_id, org_id) do nothing`,
  );
}

async function ensureSigningKey(pool: pg.Pool): Promise<void> {
  const { rows } = await pool.query<{ n: number }>(
    `select count(*)::int as n from signing_keys where status = 'active'`,
  );
  if (rows[0].n > 0) return;
  const key = await generateSigningKey();
  const pkcs8 = await exportPKCS8(key.privateKey);
  await pool.query(
    `insert into signing_keys (kid, alg, private_pkcs8, public_jwk, status)
     values ($1,$2,$3,$4::jsonb,'active')`,
    [key.kid, key.alg, pkcs8, JSON.stringify(key.publicJwk)],
  );
}
