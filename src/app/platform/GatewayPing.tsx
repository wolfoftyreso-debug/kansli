"use client";

import { useActionState } from "react";
import { pingAiGateway, type GatewayPingState } from "./actions";

export function GatewayPing() {
  const [state, action, pending] = useActionState(pingAiGateway, null as GatewayPingState);

  return (
    <form action={action} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft disabled:opacity-60"
      >
        {pending ? "Anropar…" : "Pinga gatewayen"}
      </button>
      {state?.ok ? (
        <p className="font-mono text-xs text-faint">
          {state.model} · {state.latencyMs} ms · inferens “{state.text}”
        </p>
      ) : null}
      {state && !state.ok ? <p className="text-sm text-muted">{state.error}</p> : null}
    </form>
  );
}
