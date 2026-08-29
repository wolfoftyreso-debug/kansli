"use client";

import { useEffect, useState } from "react";

/** True below the `sm` breakpoint — phone-first chart ticks and type. */
export function useNarrow(query = "(max-width: 639px)"): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);
  return narrow;
}
