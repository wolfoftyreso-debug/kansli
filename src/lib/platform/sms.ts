/**
 * Thin SMS channel. Products call this — they do not talk to 46elks themselves.
 * Constitution art. 8.
 */

export interface SmsSendInput {
  to: string;
  body: string;
  from?: string;
}

export interface SmsSendResult {
  ok: boolean;
  providerRef: string | null;
  reason: string | null;
}

export function smsCredentials(): { username: string; password: string } | null {
  const username = process.env.ELKS_API_USERNAME || process.env.ELKS_API_USER || "";
  const password = process.env.ELKS_API_PASSWORD || "";
  if (!username || !password) return null;
  return { username, password };
}

export function smsConfigured(): boolean {
  return smsCredentials() !== null;
}

export function normalizeSwedishMobile(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  const compact = digits.startsWith("00") ? `+${digits.slice(2)}` : digits;
  const e164 = compact.startsWith("0") ? `+46${compact.slice(1)}` : compact;
  if (!/^\+46[1-9]\d{7,9}$/.test(e164)) return null;
  return e164;
}

export function salesSmsBody(input: {
  invoiceNumber: string;
  customerName: string;
  amountLabel: string;
}): string {
  return `Sälj: faktura ${input.invoiceNumber} till ${input.customerName}, ${input.amountLabel}. Pixdrift Ekonomi.`;
}

export async function sendSms(
  input: SmsSendInput,
  fetchImpl: typeof fetch = fetch,
): Promise<SmsSendResult> {
  const creds = smsCredentials();
  if (!creds) {
    return {
      ok: false,
      providerRef: null,
      reason: "Ingen telefonleverantör är kopplad. Meddelandet skickas inte.",
    };
  }
  const to = normalizeSwedishMobile(input.to);
  if (!to) {
    return { ok: false, providerRef: null, reason: "Telefonnumret går inte att använda." };
  }
  const body = input.body.trim();
  if (!body || body.length > 300) {
    return { ok: false, providerRef: null, reason: "Meddelandet är tomt eller för långt." };
  }
  const from = (input.from || process.env.ELKS_FROM || "Pixdrift").slice(0, 11);
  const payload = new URLSearchParams({ from, to, message: body });
  const auth = Buffer.from(`${creds.username}:${creds.password}`).toString("base64");
  try {
    const response = await fetchImpl("https://api.46elks.com/a1/sms", {
      method: "POST",
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });
    const text = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        providerRef: null,
        reason: `Telefonleverantören svarade ${response.status}.`,
      };
    }
    let id: string | null = null;
    try {
      const parsed = JSON.parse(text) as { id?: string };
      id = parsed.id ?? null;
    } catch {
      id = null;
    }
    return { ok: true, providerRef: id, reason: null };
  } catch {
    return { ok: false, providerRef: null, reason: "Telefonleverantören gick inte att nå." };
  }
}
