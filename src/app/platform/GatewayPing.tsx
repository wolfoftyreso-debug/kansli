"use client";

import { useActionState } from "react";
import { t, type Locale } from "@/lib/i18n";
import { pingAiGateway, type GatewayPingState } from "./actions";

export function GatewayPing({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(pingAiGateway, null as GatewayPingState);

  return (
    <form action={action} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? t(locale, "platform.gatewayPinging") : t(locale, "platform.gatewayPing")}
      </button>
      {state?.ok ? (
        <p className="font-mono text-xs text-faint">
          {t(locale, "platform.gatewayReply", {
            model: state.model,
            ms: state.latencyMs,
            text: state.text,
          })}
        </p>
      ) : null}
      {state && !state.ok ? <p className="text-sm text-muted">{state.error}</p> : null}
    </form>
  );
}
