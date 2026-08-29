/**
 * Thin speech channel. Products call this — they do not talk to ElevenLabs
 * themselves. Constitution art. 8.
 */

export const TTS_MAX_CHARS = 4_000;
export const TTS_DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb";
export const TTS_DEFAULT_MODEL = "eleven_multilingual_v2";
export const TTS_ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech";

export type TtsResult =
  | { ok: true; audio: Uint8Array; contentType: string; providerRef: string | null }
  | { ok: false; audio: null; contentType: null; providerRef: null; reason: string };

export function ttsApiKey(env: Record<string, string | undefined> = process.env): string | null {
  const key = env.ELEVENLABS_API_KEY?.trim() || env.ELEVEN_API_KEY?.trim() || "";
  return key || null;
}

export function ttsVoiceId(env: Record<string, string | undefined> = process.env): string {
  return env.ELEVENLABS_VOICE_ID?.trim() || TTS_DEFAULT_VOICE;
}

export function ttsConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(ttsApiKey(env));
}

export function clipSpeechText(text: string, max = TTS_MAX_CHARS): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export async function synthesizeSpeech(
  input: { text: string; voiceId?: string },
  fetchImpl: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): Promise<TtsResult> {
  const apiKey = ttsApiKey(env);
  if (!apiKey) {
    return {
      ok: false,
      audio: null,
      contentType: null,
      providerRef: null,
      reason: "No speech vendor is connected. Speech is not played.",
    };
  }
  const text = clipSpeechText(input.text);
  if (!text) {
    return {
      ok: false,
      audio: null,
      contentType: null,
      providerRef: null,
      reason: "There is no text to read.",
    };
  }
  const voiceId = input.voiceId?.trim() || ttsVoiceId(env);
  const model = env.ELEVENLABS_MODEL?.trim() || TTS_DEFAULT_MODEL;
  try {
    const response = await fetchImpl(`${TTS_ENDPOINT}/${encodeURIComponent(voiceId)}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        accept: "audio/mpeg",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: model,
        output_format: "mp3_44100_128",
      }),
    });
    if (!response.ok) {
      return {
        ok: false,
        audio: null,
        contentType: null,
        providerRef: null,
        reason: `The speech vendor responded ${response.status}.`,
      };
    }
    const audio = new Uint8Array(await response.arrayBuffer());
    return {
      ok: true,
      audio,
      contentType: response.headers.get("content-type") || "audio/mpeg",
      providerRef: response.headers.get("request-id"),
    };
  } catch {
    return {
      ok: false,
      audio: null,
      contentType: null,
      providerRef: null,
      reason: "The speech vendor could not be reached.",
    };
  }
}
