/**
 * Vendor-channel inventory for the operations desk. Names and env *names*
 * only — never values. No live probe. Fail-closed configured flags reuse
 * the same helpers the products already call.
 */

import { gatewaySnapshot } from "./ai.ts";
import { creditConfigured } from "./credit.ts";
import { revolutConfigState } from "../ekonomi/revolut/config.ts";
import { smsConfigured } from "./sms.ts";
import { ttsConfigured } from "./tts.ts";
import { webintelConfigured } from "./webintel.ts";

export type VendorChannel = {
  id: string;
  label: string;
  vendor: string;
  /** Environment variable *names*. Values are never included. */
  env: string[];
  configured: boolean;
  note: string | null;
};

function present(env: Record<string, string | undefined>, name: string): boolean {
  return Boolean(env[name]?.trim());
}

export function vendorChannels(
  env: Record<string, string | undefined> = process.env,
): VendorChannel[] {
  const gateway = gatewaySnapshot(env);
  const revolut = revolutConfigState(env);
  return [
    {
      id: "sms",
      label: "SMS",
      vendor: "46elks",
      env: ["ELKS_API_USERNAME", "ELKS_API_PASSWORD"],
      configured: smsConfigured(),
      note: "Ekonomi sales SMS. SENT only if the vendor accepted.",
    },
    {
      id: "tts",
      label: "Speech",
      vendor: "ElevenLabs",
      env: ["ELEVENLABS_API_KEY"],
      configured: ttsConfigured(env),
      note: "IRMA listen. Products must not call the vendor.",
    },
    {
      id: "credit",
      label: "Credit report",
      vendor: "Creditsafe",
      env: ["CREDITSAFE_USERNAME", "CREDITSAFE_PASSWORD"],
      configured: creditConfigured(env),
      note: "CREDITAE pass-through. No invented score.",
    },
    {
      id: "webintel",
      label: "Search visibility",
      vendor: "Semrush",
      env: ["SEMRUSH_API_KEY"],
      configured: webintelConfigured(env),
      note: "MAJ and CREDITAE fetch on an explicit action. Never on page load.",
    },
    {
      id: "gateway",
      label: "Model gateway",
      vendor: "Vercel Gateway",
      env: ["AI_GATEWAY_API_KEY"],
      configured: gateway.configured,
      note: gateway.configured ? gateway.auth : "Missing key. Models stay off.",
    },
    {
      id: "openai",
      label: "OpenAI",
      vendor: "OpenAI",
      env: ["OPENAI_API_KEY"],
      configured: present(env, "OPENAI_API_KEY"),
      note: null,
    },
    {
      id: "anthropic",
      label: "Anthropic",
      vendor: "Anthropic",
      env: ["ANTHROPIC_API_KEY"],
      configured: present(env, "ANTHROPIC_API_KEY"),
      note: null,
    },
    {
      id: "gemini",
      label: "Gemini",
      vendor: "Google",
      env: ["GEMINI_API_KEY"],
      configured: present(env, "GEMINI_API_KEY"),
      note: null,
    },
    {
      id: "mail",
      label: "Transactional mail",
      vendor: "Resend",
      env: ["RESEND_API_KEY"],
      configured: present(env, "RESEND_API_KEY"),
      note: "Named. Core not built.",
    },
    {
      id: "revolut",
      label: "Bank statements",
      vendor: "Revolut Business",
      env: ["REVOLUT_CLIENT_ID", "REVOLUT_CLIENT_SECRET"],
      configured: revolut.missing.length === 0,
      note: revolut.missing.length === 0 ? revolut.environment : "Not connected.",
    },
  ];
}
