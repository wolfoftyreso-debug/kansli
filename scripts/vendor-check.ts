/**
 * Live probe of every configured vendor API. Read-only or minimal-cost calls:
 * no SMS sent, no speech generated, no vendor units burned beyond a ping.
 * Secrets are never printed.
 */
type Result = { vendor: string; status: "OK" | "FEL" | "SAKNAS"; detail: string; ms?: number };
const results: Result[] = [];

function redact(text: string): string {
  let out = text;
  for (const [name, value] of Object.entries(process.env)) {
    if (value && value.length > 8 && /KEY|TOKEN|PASSWORD|SECRET/i.test(name)) {
      out = out.split(value).join("[REDACTED]");
    }
  }
  return out.slice(0, 300);
}

async function probe(
  vendor: string,
  envNames: string[],
  run: () => Promise<string>,
): Promise<void> {
  const missing = envNames.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    results.push({ vendor, status: "SAKNAS", detail: `saknar ${missing.join(", ")}` });
    return;
  }
  const start = Date.now();
  try {
    const detail = await run();
    results.push({ vendor, status: "OK", detail: redact(detail), ms: Date.now() - start });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ vendor, status: "FEL", detail: redact(message), ms: Date.now() - start });
  }
}

async function json(url: string, init?: RequestInit): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* raw text */
    }
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

const main = async () => {
  // 1. AI Gateway (platform channel): model list + real 16-token inference.
  await probe("AI Gateway (plattformskanal)", ["AI_GATEWAY_API_KEY"], async () => {
    const base = process.env.AI_GATEWAY_BASE_URL?.replace(/\/+$/, "") || "https://ai-gateway.vercel.sh/v1";
    const headers = {
      authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      "content-type": "application/json",
    };
    const list = await json(`${base}/models`, { headers });
    if (list.status !== 200) throw new Error(`models ${list.status}: ${JSON.stringify(list.body)}`);
    const models = ((list.body as { data?: { id: string }[] }).data ?? []).map((m) => m.id);
    const model = "openai/gpt-4.1-nano";
    const chat = await json(`${base}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        max_tokens: 16,
        messages: [
          { role: "system", content: "Svara med ett enda ord: pong. Inget annat." },
          { role: "user", content: "ping" },
        ],
      }),
    });
    if (chat.status !== 200) throw new Error(`chat ${chat.status}: ${JSON.stringify(chat.body)}`);
    const text =
      (chat.body as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message
        ?.content ?? "";
    return `${models.length} modeller · ${model}: "${text.trim()}"`;
  });

  // 2. Anthropic direct: model list (free) + 8-token inference on cheapest model.
  await probe("Anthropic", ["ANTHROPIC_API_KEY"], async () => {
    const headers = {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    };
    const list = await json("https://api.anthropic.com/v1/models?limit=100", { headers });
    if (list.status !== 200) throw new Error(`models ${list.status}: ${JSON.stringify(list.body)}`);
    const models = (list.body as { data: { id: string }[] }).data.map((m) => m.id);
    const model = models.find((id) => id.includes("haiku")) ?? models[0]!;
    const chat = await json("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        max_tokens: 8,
        messages: [{ role: "user", content: "Svara med ett ord: pong" }],
      }),
    });
    if (chat.status !== 200) throw new Error(`messages ${chat.status}: ${JSON.stringify(chat.body)}`);
    const text = (chat.body as { content: { text?: string }[] }).content?.[0]?.text ?? "";
    return `${models.length} modeller · ${model}: "${text.trim()}"`;
  });

  // 3. OpenAI direct: model list (free) + tiny inference on a nano/mini model.
  await probe("OpenAI", ["OPENAI_API_KEY"], async () => {
    const headers = {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    };
    const list = await json("https://api.openai.com/v1/models", { headers });
    if (list.status !== 200) throw new Error(`models ${list.status}: ${JSON.stringify(list.body)}`);
    const models = (list.body as { data: { id: string }[] }).data.map((m) => m.id);
    const model =
      models.find((id) => id === "gpt-4.1-nano") ??
      models.find((id) => id.includes("mini")) ??
      models[0]!;
    const chat = await json("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        max_tokens: 8,
        messages: [{ role: "user", content: "Svara med ett ord: pong" }],
      }),
    });
    if (chat.status === 429) {
      throw new Error(
        `nyckeln är giltig (${models.length} modeller listas) men saldot är slut — fyll på krediter hos OpenAI`,
      );
    }
    if (chat.status !== 200) throw new Error(`chat ${chat.status}: ${JSON.stringify(chat.body)}`);
    const text =
      (chat.body as { choices: { message: { content: string } }[] }).choices?.[0]?.message
        ?.content ?? "";
    return `${models.length} modeller · ${model}: "${text.trim()}"`;
  });

  // 4. Gemini: model list (free) + tiny inference on a flash model.
  await probe("Google Gemini", ["GEMINI_API_KEY"], async () => {
    const key = process.env.GEMINI_API_KEY!;
    const list = await json(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=50&key=${key}`,
    );
    if (list.status !== 200) throw new Error(`models ${list.status}: ${JSON.stringify(list.body)}`);
    const entries = (
      (list.body as { models?: { name: string; supportedGenerationMethods?: string[] }[] })
        .models ?? []
    ).map((m) => ({
      id: m.name.replace("models/", ""),
      methods: m.supportedGenerationMethods ?? [],
    }));
    const models = entries.map((m) => m.id);
    const usable = entries
      .filter((m) => m.methods.includes("generateContent"))
      .map((m) => m.id)
      .filter((id) => !/image|lite|8b|tts|live|embed/.test(id));
    const flash = usable.filter((id) => id.includes("flash")).sort().reverse();
    const candidates = [...new Set([...flash, ...usable])].slice(0, 6);
    const generate = (target: string) =>
      json(
        `https://generativelanguage.googleapis.com/v1beta/models/${target}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Svara med ett ord: pong" }] }],
            generationConfig: { maxOutputTokens: 8 },
          }),
        },
      );
    let model = candidates[0] ?? models[0]!;
    let chat: { status: number; body: unknown } = { status: 0, body: "ej försökt" };
    // Newer models may demand another API surface or hang; walk the candidates.
    for (const candidate of candidates) {
      model = candidate;
      try {
        chat = await generate(model);
      } catch {
        continue;
      }
      if (chat.status === 200 || chat.status === 401 || chat.status === 403) break;
    }
    if (chat.status !== 200) throw new Error(`generate ${chat.status}: ${JSON.stringify(chat.body)}`);
    const text =
      (chat.body as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
        .candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return `${models.length} modeller · ${model}: "${text.trim()}"`;
  });

  // 5. ElevenLabs: auth check only. No speech is generated.
  await probe("ElevenLabs (tal)", ["ELEVENLABS_API_KEY"], async () => {
    const res = await json("https://api.elevenlabs.io/v1/user", {
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
    });
    if (res.status !== 200) throw new Error(`user ${res.status}: ${JSON.stringify(res.body)}`);
    const body = res.body as { subscription?: { tier?: string; character_count?: number } };
    return `konto ok · plan ${body.subscription?.tier ?? "?"} · ${body.subscription?.character_count ?? "?"} tecken använda`;
  });

  // 6. Creditsafe: authenticate only. No report fetched.
  await probe("Creditsafe (kredit)", ["CREDITSAFE_USERNAME", "CREDITSAFE_PASSWORD"], async () => {
    const base =
      process.env.CREDITSAFE_BASE_URL?.replace(/\/+$/, "") ||
      (process.env.CREDITSAFE_SANDBOX === "true"
        ? "https://connect.sandbox.creditsafe.com/v1"
        : "https://connect.creditsafe.com/v1");
    const res = await json(`${base}/authenticate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: process.env.CREDITSAFE_USERNAME,
        password: process.env.CREDITSAFE_PASSWORD,
      }),
    });
    if (res.status !== 200) throw new Error(`authenticate ${res.status}`);
    return `inloggning ok mot ${base.includes("sandbox") ? "sandbox" : "produktion"}`;
  });

  // 7. Semrush: unit balance (free endpoint). No report units spent.
  await probe("Semrush (söksynlighet)", ["SEMRUSH_API_KEY"], async () => {
    const res = await json(
      `https://www.semrush.com/users/countapiunits.html?key=${process.env.SEMRUSH_API_KEY}`,
    );
    if (res.status !== 200) throw new Error(`countapiunits ${res.status}: ${JSON.stringify(res.body)}`);
    const text = String(res.body).trim();
    if (/ERROR/i.test(text)) throw new Error(text);
    return `nyckel ok · ${Number(text).toLocaleString("sv-SE")} API-units kvar`;
  });

  // 8. 46elks: account info. No SMS sent.
  await probe("46elks (SMS)", ["ELKS_API_USERNAME", "ELKS_API_PASSWORD"], async () => {
    const auth = Buffer.from(
      `${process.env.ELKS_API_USERNAME}:${process.env.ELKS_API_PASSWORD}`,
    ).toString("base64");
    const res = await json("https://api.46elks.com/a1/me", {
      headers: { authorization: `Basic ${auth}` },
    });
    if (res.status !== 200) throw new Error(`me ${res.status}: ${JSON.stringify(res.body)}`);
    const body = res.body as { displayname?: string; balance?: number; currency?: string };
    return `konto "${body.displayname ?? "?"}" · saldo ${((body.balance ?? 0) / 10000).toFixed(2)} ${body.currency ?? ""}`;
  });

  // 9. Resend: read-only domain list.
  await probe("Resend (mejl)", ["RESEND_API_KEY"], async () => {
    const res = await json("https://api.resend.com/domains", {
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    if (res.status !== 200) throw new Error(`domains ${res.status}: ${JSON.stringify(res.body)}`);
    const data = (res.body as { data?: { name: string; status: string }[] }).data ?? [];
    return data.length === 0
      ? "nyckel ok · inga domäner verifierade ännu"
      : `nyckel ok · ${data.map((d) => `${d.name} (${d.status})`).join(", ")}`;
  });

  // 10. Mapbox: one forward geocode (free tier).
  await probe("Mapbox (kartor)", ["MAPBOX_ACCESS_TOKEN"], async () => {
    const res = await json(
      `https://api.mapbox.com/search/geocode/v6/forward?q=Stockholm&limit=1&access_token=${process.env.MAPBOX_ACCESS_TOKEN}`,
    );
    if (res.status !== 200) throw new Error(`geocode ${res.status}: ${JSON.stringify(res.body)}`);
    const name = (res.body as { features?: { properties?: { full_address?: string } }[] })
      .features?.[0]?.properties?.full_address;
    return `token ok · geokodade "Stockholm" → ${name ?? "träff"}`;
  });

  // 11. Apollo.io: auth health check.
  await probe("Apollo.io (B2B-data)", ["APOLLO_API_KEY"], async () => {
    const res = await json("https://api.apollo.io/api/v1/auth/health", {
      headers: { "x-api-key": process.env.APOLLO_API_KEY! },
    });
    if (res.status !== 200) throw new Error(`health ${res.status}: ${JSON.stringify(res.body)}`);
    const ok = (res.body as { is_logged_in?: boolean }).is_logged_in;
    if (!ok) throw new Error("nyckeln avvisades (is_logged_in=false)");
    return "nyckel ok · inloggad";
  });

  const width = Math.max(...results.map((r) => r.vendor.length));
  console.log("VENDOR-API-KONTROLL —", new Date().toISOString());
  console.log("");
  for (const r of results) {
    const ms = r.ms != null ? ` (${r.ms} ms)` : "";
    console.log(`${r.vendor.padEnd(width)}  ${r.status.padEnd(6)} ${r.detail}${ms}`);
  }
  const ok = results.filter((r) => r.status === "OK").length;
  const fel = results.filter((r) => r.status === "FEL").length;
  const saknas = results.filter((r) => r.status === "SAKNAS").length;
  console.log("");
  console.log(`Summering: ${ok} OK · ${fel} FEL · ${saknas} SAKNAS`);
};

main().catch((error) => {
  console.error("probe-fel:", error instanceof Error ? error.message : error);
  process.exit(1);
});
