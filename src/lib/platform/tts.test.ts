import { afterEach, describe, expect, it } from "vitest";
import {
  clipSpeechText,
  synthesizeSpeech,
  ttsConfigured,
  TTS_DEFAULT_VOICE,
  TTS_ENDPOINT,
  TTS_MAX_CHARS,
} from "./tts.ts";

const saved = {
  key: process.env.ELEVENLABS_API_KEY,
  alt: process.env.ELEVEN_API_KEY,
  voice: process.env.ELEVENLABS_VOICE_ID,
};

afterEach(() => {
  if (saved.key) process.env.ELEVENLABS_API_KEY = saved.key;
  else delete process.env.ELEVENLABS_API_KEY;
  if (saved.alt) process.env.ELEVEN_API_KEY = saved.alt;
  else delete process.env.ELEVEN_API_KEY;
  if (saved.voice) process.env.ELEVENLABS_VOICE_ID = saved.voice;
  else delete process.env.ELEVENLABS_VOICE_ID;
});

describe("tts channel", () => {
  it("clips long text and reports when the vendor is missing", async () => {
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVEN_API_KEY;
    expect(ttsConfigured()).toBe(false);
    expect(clipSpeechText("  hej   du  ")).toBe("hej du");
    expect(clipSpeechText("x".repeat(TTS_MAX_CHARS + 20)).endsWith("…")).toBe(true);
    const result = await synthesizeSpeech({ text: "hej" }, async () => {
      throw new Error("should not fetch");
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/kopplad/);
  });

  it("posts to ElevenLabs when a key exists and never echoes the key", async () => {
    process.env.ELEVENLABS_API_KEY = "sk-test-not-real";
    process.env.ELEVENLABS_VOICE_ID = "voice-1";
    const result = await synthesizeSpeech({ text: "Hej motpart" }, async (url, init) => {
      expect(String(url)).toBe(`${TTS_ENDPOINT}/voice-1`);
      const headers = new Headers(init?.headers);
      expect(headers.get("xi-api-key")).toBe("sk-test-not-real");
      const body = JSON.parse(String(init?.body)) as { text: string; model_id: string };
      expect(body.text).toBe("Hej motpart");
      expect(body.model_id).toContain("multilingual");
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "audio/mpeg", "request-id": "tts-1" },
      });
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.contentType).toBe("audio/mpeg");
      expect(result.providerRef).toBe("tts-1");
      expect(Array.from(result.audio)).toEqual([1, 2, 3]);
    }
    expect(JSON.stringify(result)).not.toContain("sk-test-not-real");
  });

  it("uses the documented default voice when none is set", async () => {
    process.env.ELEVENLABS_API_KEY = "sk-test-not-real";
    delete process.env.ELEVENLABS_VOICE_ID;
    const result = await synthesizeSpeech({ text: "hej" }, async (url) => {
      expect(String(url)).toBe(`${TTS_ENDPOINT}/${TTS_DEFAULT_VOICE}`);
      return new Response(new Uint8Array([9]), { status: 200 });
    });
    expect(result.ok).toBe(true);
  });

  it("does not call the vendor for empty text", async () => {
    process.env.ELEVENLABS_API_KEY = "sk-test-not-real";
    const result = await synthesizeSpeech({ text: "   " }, async () => {
      throw new Error("should not fetch");
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/text/);
  });
});
