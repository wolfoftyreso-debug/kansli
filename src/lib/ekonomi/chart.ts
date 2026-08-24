export type AccountKind = "asset" | "liability" | "income" | "expense";

export interface Account {
  code: string;
  name: string;
  kind: AccountKind;
  vatRateBps: number | null;
}

/** BAS 2024 subset for a Swedish workshop. Not the full plan. */
export const CHART: readonly Account[] = [
  { code: "1510", name: "Kundfordringar", kind: "asset", vatRateBps: null },
  { code: "1910", name: "Kassa", kind: "asset", vatRateBps: null },
  { code: "1930", name: "Bank / Revolut", kind: "asset", vatRateBps: null },
  { code: "1931", name: "Stripe clearing", kind: "asset", vatRateBps: null },
  { code: "1932", name: "Swish clearing", kind: "asset", vatRateBps: null },
  { code: "2610", name: "Utgående moms 25 %", kind: "liability", vatRateBps: 2500 },
  { code: "2614", name: "Utgående moms 12 %", kind: "liability", vatRateBps: 1200 },
  { code: "2615", name: "Utgående moms 6 %", kind: "liability", vatRateBps: 600 },
  { code: "3001", name: "Försäljning tjänster 25 %", kind: "income", vatRateBps: 2500 },
  { code: "3002", name: "Försäljning tjänster 12 %", kind: "income", vatRateBps: 1200 },
  { code: "3041", name: "Försäljning varor 25 %", kind: "income", vatRateBps: 2500 },
  { code: "3740", name: "Öresavrundning", kind: "income", vatRateBps: 0 },
];

const BY_CODE = new Map(CHART.map((account) => [account.code, account]));

export function getAccount(code: string): Account {
  const account = BY_CODE.get(code);
  if (!account) throw new Error(`okänt konto ${code}`);
  return account;
}

export function salesAccount(kind: "service" | "goods", vatRateBps: number): string {
  if (kind === "goods") {
    if (vatRateBps !== 2500) throw new Error("varor i grunden bara 25 % moms.");
    return "3041";
  }
  if (vatRateBps === 2500) return "3001";
  if (vatRateBps === 1200) return "3002";
  throw new Error("tjänster i grunden 12 eller 25 % moms.");
}

export function vatAccount(vatRateBps: number): string | null {
  if (vatRateBps === 2500) return "2610";
  if (vatRateBps === 1200) return "2614";
  if (vatRateBps === 600) return "2615";
  if (vatRateBps === 0) return null;
  throw new Error(`okänd momssats ${vatRateBps}`);
}

export function railAccount(rail: "swish" | "stripe" | "invoice_10" | "revolut"): string {
  if (rail === "stripe") return "1931";
  if (rail === "swish") return "1932";
  if (rail === "revolut") return "1930";
  return "1910";
}
