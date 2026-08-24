export const PAYMENT_RAILS = ["swish", "stripe", "invoice_10", "revolut"] as const;
export type PaymentRail = (typeof PAYMENT_RAILS)[number];

export interface RailState {
  id: PaymentRail;
  label: string;
  offerable: boolean;
  receivable: boolean;
  reason: string;
  envKey: string;
}

export interface ConnectorEnv {
  stripeKey: string | null;
  revolutBusiness: string | null;
  revolutMerchant: string | null;
  swishPayee: string | null;
}

export function readConnectorEnv(env: NodeJS.ProcessEnv = process.env): ConnectorEnv {
  const pick = (key: string) => {
    const value = env[key]?.trim();
    return value ? value : null;
  };
  return {
    stripeKey: pick("STRIPE_SECRET_KEY") ?? pick("STRIPE_RESTRICTED_KEY"),
    revolutBusiness: pick("REVOLUT_BUSINESS_TOKEN"),
    revolutMerchant: pick("REVOLUT_MERCHANT_SECRET"),
    swishPayee: pick("SWISH_PAYEE_ALIAS"),
  };
}

export function stripeKeyMode(
  key: string | null,
): "empty" | "test" | "live" | "restricted-test" | "restricted-live" {
  if (!key) return "empty";
  if (key.startsWith("rk_live_")) return "restricted-live";
  if (key.startsWith("rk_test_")) return "restricted-test";
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "empty";
}

export function railSnapshot(env: NodeJS.ProcessEnv = process.env): Record<PaymentRail, RailState> {
  const keys = readConnectorEnv(env);
  const stripeMode = stripeKeyMode(keys.stripeKey);
  return {
    invoice_10: {
      id: "invoice_10",
      label: "Faktura 10 dagar",
      offerable: true,
      receivable: true,
      reason: "Fungerar utan extern adapter. Kunden betalar mot förfallodatum.",
      envKey: "—",
    },
    stripe: {
      id: "stripe",
      label: "Stripe",
      offerable: stripeMode !== "empty",
      receivable: stripeMode !== "empty",
      reason:
        stripeMode === "empty"
          ? "Ingen STRIPE_SECRET_KEY / STRIPE_RESTRICTED_KEY. Checkout skapas inte."
          : `Nyckeltyp ${stripeMode}. Checkout Sessions, inga påhittade charges.`,
      envKey: "STRIPE_SECRET_KEY",
    },
    revolut: {
      id: "revolut",
      label: "Revolut",
      offerable: Boolean(keys.revolutMerchant),
      receivable: Boolean(keys.revolutBusiness || keys.revolutMerchant),
      reason: keys.revolutBusiness
        ? "Business-token finns. Matchning kan köras. Merchant-order bara om REVOLUT_MERCHANT_SECRET också finns."
        : keys.revolutMerchant
          ? "Merchant-secret finns. Business-matchning saknas."
          : "Ingen Revolut-token. Varken matchning eller kundbetalning.",
      envKey: "REVOLUT_BUSINESS_TOKEN",
    },
    swish: {
      id: "swish",
      label: "Swish",
      offerable: false,
      receivable: Boolean(keys.swishPayee),
      reason: keys.swishPayee
        ? "Payee-alias finns, men Swish Handel-certifikat är inte inkopplat. Mottaget kan bokas manuellt."
        : "Ingen SWISH_PAYEE_ALIAS. Swish Handel kräver bankcertifikat — inte låtsas-QR.",
      envKey: "SWISH_PAYEE_ALIAS",
    },
  };
}
