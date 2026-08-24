import type pg from "pg";
import type { SupplierAccount, TyreSupplierAdapter } from "./interface.ts";
import type { Result, SupplierId, SupplierOffer, SupplierProduct } from "./types.ts";

const KNOWN: readonly SupplierId[] = ["ntg", "delticom", "inter_sprint", "deldo"];

export function isSupplierId(value: string): value is SupplierId {
  return (KNOWN as readonly string[]).includes(value);
}

export async function listSupplierAccounts(
  pool: pg.Pool,
  orgRef: string,
): Promise<SupplierAccount[]> {
  const { rows } = await pool.query<{
    id: string;
    org_ref: string;
    supplier_id: string;
    external_customer_id: string | null;
    credentials_reference: string | null;
    currency: string;
    enabled: boolean;
    priority: number;
    pricing_enabled: boolean;
    ordering_enabled: boolean;
    last_ok_at: Date | null;
    last_error_at: Date | null;
    last_error_message: string | null;
  }>(
    `select id, org_ref, supplier_id, external_customer_id, credentials_reference,
            currency, enabled, priority, pricing_enabled, ordering_enabled,
            last_ok_at, last_error_at, last_error_message
       from tyra.tenant_supplier_accounts
      where org_ref = $1
      order by priority asc, created_at asc`,
    [orgRef],
  );
  return rows.map((row) => ({
    id: row.id,
    orgRef: row.org_ref,
    supplierId: isSupplierId(row.supplier_id) ? row.supplier_id : "ntg",
    externalCustomerId: row.external_customer_id,
    credentialsReference: row.credentials_reference,
    currency: row.currency,
    enabled: row.enabled,
    priority: row.priority,
    pricingEnabled: row.pricing_enabled,
    orderingEnabled: row.ordering_enabled,
    lastOkAt: row.last_ok_at ? new Date(row.last_ok_at).toISOString() : null,
    lastErrorAt: row.last_error_at ? new Date(row.last_error_at).toISOString() : null,
    lastErrorMessage: row.last_error_message,
  }));
}

/** No live adapter is registered in this repo. Demo/fake prices are forbidden. */
export function resolveAdapter(_supplierId: SupplierId): TyreSupplierAdapter | null {
  return null;
}

export async function searchSupplierProducts(input: {
  pool: pg.Pool;
  orgRef: string;
  identity: { width: number; aspectRatio: number; rimDiameter: number; season?: string | null };
}): Promise<Result<SupplierProduct[]>> {
  const accounts = (await listSupplierAccounts(input.pool, input.orgRef)).filter(
    (account) => account.enabled && account.pricingEnabled,
  );
  if (accounts.length === 0) {
    return {
      ok: false,
      error: {
        kind: "NOT_CONFIGURED",
        message: "Ingen leverantör är kopplad för den här organisationen.",
      },
    };
  }
  const adapter = resolveAdapter(accounts[0]!.supplierId);
  if (!adapter) {
    return {
      ok: false,
      error: {
        kind: "NOT_CONFIGURED",
        message: "Leverantörskonto finns, men ingen adapter är registrerad i navet.",
        supplierId: accounts[0]!.supplierId,
      },
    };
  }
  return adapter.searchProducts({
    orgRef: input.orgRef,
    account: accounts[0]!,
    identity: input.identity,
  });
}

export async function getSupplierOffer(input: {
  pool: pg.Pool;
  orgRef: string;
  tireProductId: string;
}): Promise<Result<SupplierOffer | null>> {
  const accounts = (await listSupplierAccounts(input.pool, input.orgRef)).filter(
    (account) => account.enabled && account.pricingEnabled,
  );
  if (accounts.length === 0 || !resolveAdapter(accounts[0]!.supplierId)) {
    return {
      ok: false,
      error: {
        kind: "NOT_CONFIGURED",
        message: "Live-pris finns inte. Ingen leverantörsadapter är kopplad.",
        supplierId: accounts[0]?.supplierId,
      },
    };
  }
  return resolveAdapter(accounts[0]!.supplierId)!.getOffer({
    orgRef: input.orgRef,
    account: accounts[0]!,
    tireProductId: input.tireProductId,
  });
}
