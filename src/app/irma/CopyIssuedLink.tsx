"use client";

import { useState } from "react";

export function CopyIssuedLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <input
        readOnly
        value={url}
        className="min-h-11 w-full rounded-md border border-line bg-paper px-3 py-2 font-mono text-sm text-ink"
      />
      <button
        type="button"
        onClick={copy}
        className="self-start rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
      >
        {copied ? "Kopierad" : "Kopiera länken"}
      </button>
    </div>
  );
}
