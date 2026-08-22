import { describe, expect, it } from "vitest";
import {
  anthropicProvider,
  geminiProvider,
  openAICompatibleProvider,
  ProviderError,
} from "../src/index.ts";

interface Captured {
  url: string;
  init: RequestInit | undefined;
}

function mockFetch(status: number, body: unknown, capture?: Captured[]): typeof fetch {
  return (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    capture?.push({ url: String(input), init });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
}

describe("Anthropic adapter", () => {
  it("maps the response and sends the right headers/system", async () => {
    const seen: Captured[] = [];
    const provider = anthropicProvider({
      apiKey: "sk-test",
      fetchImpl: mockFetch(
        200,
        { content: [{ type: "text", text: "hej där" }], usage: { input_tokens: 11, output_tokens: 5 }, stop_reason: "end_turn" },
        seen,
      ),
    });
    const res = await provider.complete({
      model: "claude-x",
      promptVersion: "p1",
      messages: [
        { role: "system", content: "var kortfattad" },
        { role: "user", content: "hej" },
      ],
    });
    expect(res.kind).toBe("inference");
    expect(res.text).toBe("hej där");
    expect(res.usage).toEqual({ inputTokens: 11, outputTokens: 5 });
    expect(res.finishReason).toBe("end_turn");
    expect(res.promptVersion).toBe("p1");

    const headers = seen[0].init?.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("sk-test");
    expect(headers["anthropic-version"]).toBeTruthy();
    const body = JSON.parse(String(seen[0].init?.body));
    expect(body.system).toBe("var kortfattad"); // system split out of messages
    expect(body.messages).toEqual([{ role: "user", content: "hej" }]);
  });

  it("throws ProviderError on a non-2xx", async () => {
    const provider = anthropicProvider({ apiKey: "x", fetchImpl: mockFetch(401, { error: "no" }) });
    await expect(provider.complete({ model: "m", messages: [] })).rejects.toBeInstanceOf(ProviderError);
  });
});

describe("OpenAI-compatible adapter", () => {
  it("maps choices/usage and uses Bearer auth", async () => {
    const seen: Captured[] = [];
    const provider = openAICompatibleProvider({
      apiKey: "sk-oa",
      name: "openai",
      fetchImpl: mockFetch(
        200,
        { choices: [{ message: { content: "svar" }, finish_reason: "stop" }], usage: { prompt_tokens: 3, completion_tokens: 4 } },
        seen,
      ),
    });
    const res = await provider.complete({ model: "gpt-x", messages: [{ role: "user", content: "q" }] });
    expect(res.provider).toBe("openai");
    expect(res.text).toBe("svar");
    expect(res.usage).toEqual({ inputTokens: 3, outputTokens: 4 });
    const headers = seen[0].init?.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer sk-oa");
    expect(seen[0].url).toContain("/chat/completions");
  });

  it("honours a custom baseUrl (gateway)", async () => {
    const seen: Captured[] = [];
    const provider = openAICompatibleProvider({
      apiKey: "gw",
      name: "gateway",
      baseUrl: "https://gw.example/v1",
      fetchImpl: mockFetch(200, { choices: [{ message: { content: "" }, finish_reason: "stop" }] }, seen),
    });
    await provider.complete({ model: "anthropic/claude", messages: [] });
    expect(seen[0].url).toBe("https://gw.example/v1/chat/completions");
  });
});

describe("Gemini adapter", () => {
  it("maps candidates/usageMetadata and puts the key + model in the URL", async () => {
    const seen: Captured[] = [];
    const provider = geminiProvider({
      apiKey: "g-key",
      fetchImpl: mockFetch(
        200,
        {
          candidates: [{ content: { parts: [{ text: "ge" }, { text: "mini" }] }, finishReason: "STOP" }],
          usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 2 },
        },
        seen,
      ),
    });
    const res = await provider.complete({
      model: "gemini-1.5",
      messages: [
        { role: "system", content: "sys" },
        { role: "user", content: "u" },
      ],
    });
    expect(res.text).toBe("gemini");
    expect(res.usage).toEqual({ inputTokens: 7, outputTokens: 2 });
    expect(res.finishReason).toBe("STOP");
    expect(seen[0].url).toContain("/models/gemini-1.5:generateContent");
    expect(seen[0].url).toContain("key=g-key");
    const body = JSON.parse(String(seen[0].init?.body));
    expect(body.systemInstruction.parts[0].text).toBe("sys");
    expect(body.contents).toEqual([{ role: "user", parts: [{ text: "u" }] }]);
  });
});
