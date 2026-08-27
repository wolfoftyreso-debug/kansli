import type { ReactNode } from "react";
import type { SystemId } from "@pixdrift/systems";

type RoomId = Exclude<SystemId, "identity">;

/** Compact system models from the Hem / Illustrations proofs. One figure, one room. */
export function LauncherMark({ id }: { id: RoomId }) {
  return (
    <svg viewBox="0 0 80 52" className="pd-launch-mark" aria-hidden>
      <g className="pd-launch-float">{MARK[id]}</g>
    </svg>
  );
}

const MARK: Record<RoomId, ReactNode> = {
  kansli: (
    <>
      <path d="M40 10 L46 13 L40 16 L34 13 Z" fill="#363b42" />
      <path d="M34 13 L40 16 L40 22 L34 19 Z" fill="#101317" />
      <path d="M40 16 L46 13 L46 19 L40 22 Z" fill="#1c2127" />
      <path d="M28 16 L34 19 L28 22 L22 19 Z" fill="#363b42" />
      <path d="M22 19 L28 22 L28 28 L22 25 Z" fill="#101317" />
      <path d="M28 22 L34 19 L34 25 L28 28 Z" fill="#1c2127" />
      <path d="M52 16 L58 19 L52 22 L46 19 Z" fill="#363b42" />
      <path d="M46 19 L52 22 L52 28 L46 25 Z" fill="#101317" />
      <path d="M52 22 L58 19 L58 25 L52 28 Z" fill="#1c2127" />
      <path d="M40 20 L46 23 L40 26 L34 23 Z" fill="#2e5ca6" />
      <path d="M34 23 L40 26 L40 32 L34 29 Z" fill="#1f4b8f" />
      <path d="M40 26 L46 23 L46 29 L40 32 Z" fill="#16376a" />
      <path d="M16 44 L64 44" stroke="#454d54" strokeWidth="2" fill="none" />
    </>
  ),
  ekonomi: (
    <>
      <path d="M40 18 L62 29 L40 40 L18 29 Z" fill="#363b42" />
      <path d="M18 29 L40 40 L40 46 L18 35 Z" fill="#101317" />
      <path d="M40 40 L62 29 L62 35 L40 46 Z" fill="#1c2127" />
      <path d="M28 20 L34 23 L28 26 L22 23 Z" fill="#363b42" />
      <path d="M22 23 L28 26 L28 34 L22 31 Z" fill="#101317" />
      <path d="M28 26 L34 23 L34 31 L28 34 Z" fill="#1c2127" />
      <path d="M52 10 L58 13 L52 16 L46 13 Z" fill="#1f4b8f" />
      <ellipse cx="52" cy="10" rx="6" ry="3" fill="#2e5ca6" />
      <path d="M14 44 L66 44" stroke="#454d54" strokeWidth="2" fill="none" />
    </>
  ),
  tora: (
    <>
      <path d="M26 12 L32 15 L26 18 L20 15 Z" fill="#363b42" />
      <path d="M20 15 L26 18 L26 40 L20 37 Z" fill="#101317" />
      <path d="M26 18 L32 15 L32 37 L26 40 Z" fill="#1c2127" />
      <path d="M54 12 L60 15 L54 18 L48 15 Z" fill="#363b42" />
      <path d="M48 15 L54 18 L54 40 L48 37 Z" fill="#101317" />
      <path d="M54 18 L60 15 L60 37 L54 40 Z" fill="#1c2127" />
      <path d="M40 6 L60 16 L40 26 L20 16 Z" fill="#363b42" />
      <path d="M20 16 L40 26 L40 30 L20 20 Z" fill="#101317" />
      <path d="M40 26 L60 16 L60 20 L40 30 Z" fill="#1c2127" />
      <path d="M40 28 L46 31 L40 34 L34 31 Z" fill="#2e5ca6" />
      <path d="M34 31 L40 34 L40 40 L34 37 Z" fill="#1f4b8f" />
      <path d="M40 34 L46 31 L46 37 L40 40 Z" fill="#16376a" />
    </>
  ),
  rita: (
    <>
      <path d="M18 8 L50 8 L50 44 L18 44 Z" fill="#ffffff" stroke="#cfcec8" strokeWidth="1.4" />
      <path d="M23 15 L45 15 M23 21 L39 21" stroke="#9aa0a7" strokeWidth="1.8" fill="none" />
      <path d="M23 28 L33 28 M23 34 L33 34" stroke="#9aa0a7" strokeWidth="1.8" fill="none" />
      <path d="M37 30 L45 30 L45 38 L37 38 Z" fill="#eaf0f8" />
      <path d="M38 35 L41 32 L44 34" stroke="#1f4b8f" strokeWidth="1.6" fill="none" />
      <path d="M54 36 Q62 30 62 18" stroke="#2f6b46" strokeWidth="2.4" fill="none" />
      <path d="M59 14 L64 12 L64 20 Z" fill="#2f6b46" />
      <path d="M54 40 L66 40" stroke="#454d54" strokeWidth="2" fill="none" />
    </>
  ),
  britt: (
    <>
      <path d="M18 40 L26 40 L26 28 L18 28 Z" fill="#87aed6" />
      <path d="M32 40 L40 40 L40 18 L32 18 Z" fill="#2c5d94" />
      <path d="M46 40 L54 40 L54 10 L46 10 Z" fill="#1f4b8f" />
      <path d="M20 22 Q34 12 50 6" stroke="#2f6b46" strokeWidth="2" fill="none" />
      <path d="M48 5 L54 4 L50 10 Z" fill="#2f6b46" />
      <path d="M14 44 L62 44" stroke="#454d54" strokeWidth="2" fill="none" />
      <circle cx="64" cy="14" r="2" fill="#9aa0a7" />
      <circle cx="68" cy="22" r="2" fill="#9aa0a7" />
      <path
        d="M58 8 L64 14 L68 22"
        stroke="#9aa0a7"
        strokeWidth="1.2"
        fill="none"
        strokeDasharray="2 2"
      />
    </>
  ),
  irma: (
    <>
      <path d="M24 8 L56 8 L56 44 L24 44 Z" fill="#ffffff" stroke="#cfcec8" strokeWidth="1.4" />
      <path d="M30 16 L50 16 M30 22 L44 22" stroke="#9aa0a7" strokeWidth="1.8" fill="none" />
      <path
        d="M30 30 L38 38 L52 22"
        stroke="#2f6b46"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  tyra: (
    <>
      <path
        d="M16 34 Q16 28 24 28 L40 28 Q48 28 48 34 Q48 40 40 40 L24 40 Q16 40 16 34 Z"
        fill="#101317"
      />
      <path d="M28 31 L28 37 M36 31 L36 37" stroke="#2a2e33" strokeWidth="2" fill="none" />
      <ellipse cx="32" cy="34" rx="5" ry="4" fill="#454d54" />
      <path
        d="M16 22 Q16 16 24 16 L40 16 Q48 16 48 22 Q48 28 40 28 L24 28 Q16 28 16 22 Z"
        fill="#1c2127"
      />
      <ellipse cx="32" cy="22" rx="5" ry="4" fill="#454d54" />
      <path d="M52 30 Q52 22 60 22 Q68 22 68 30 Q68 38 60 38 Q52 38 52 30 Z" fill="#101317" />
      <circle cx="60" cy="30" r="4" fill="#9aa0a7" />
      <path
        d="M58 12 L62 12 M60 10 L60 14 M57 10.5 L63 13.5 M63 10.5 L57 13.5"
        stroke="#87aed6"
        strokeWidth="1.4"
        fill="none"
      />
    </>
  ),
  alva: (
    <>
      <path d="M10 22 L24 22 L24 34 L10 34 Z" fill="#2f6b46" />
      <path
        d="M13 28 L16 31 L21 25"
        stroke="#fbfbf9"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M24 28 L32 28" stroke="#9aa2aa" strokeWidth="2" fill="none" />
      <path d="M32 22 L46 22 L46 34 L32 34 Z" fill="#1f4b8f" />
      <path d="M36 28 L42 28 M39 25 L39 31" stroke="#fbfbf9" strokeWidth="2" fill="none" />
      <path d="M46 28 L54 28" stroke="#9aa2aa" strokeWidth="2" fill="none" strokeDasharray="3 2" />
      <path d="M54 22 L68 22 L68 34 L54 34 Z" fill="none" stroke="#9aa2aa" strokeWidth="1.6" />
      <circle cx="58" cy="14" r="6" fill="none" stroke="#101317" strokeWidth="2.4" />
      <path
        d="M62 18 L68 24"
        stroke="#101317"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  creditae: (
    <>
      <path d="M18 10 L50 10 L50 42 L18 42 Z" fill="#ffffff" stroke="#cfcec8" strokeWidth="1.4" />
      <path
        d="M23 18 L45 18 M23 24 L40 24 M23 30 L36 30"
        stroke="#9aa0a7"
        strokeWidth="1.8"
        fill="none"
      />
      <path d="M54 16 L70 16 L70 32 L54 32 Z" fill="#1f4b8f" />
      <path
        d="M58 24 L62 28 L68 20"
        stroke="#fbfbf9"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 44 L66 44" stroke="#454d54" strokeWidth="2" fill="none" />
    </>
  ),
  // MAJ — Mät, analysera, justera: a lens over measured bars, one arrow up.
  maj: (
    <>
      <path d="M18 40 L24 40 L24 30 L18 30 Z" fill="#363b42" />
      <path d="M28 40 L34 40 L34 24 L28 24 Z" fill="#1c2127" />
      <path d="M38 40 L44 40 L44 18 L38 18 Z" fill="#101317" />
      <circle cx="36" cy="24" r="11" fill="none" stroke="#1f4b8f" strokeWidth="2.4" />
      <path d="M44 32 L52 40" stroke="#1f4b8f" strokeWidth="3" strokeLinecap="round" />
      <path d="M56 36 Q62 28 60 16" stroke="#2f6b46" strokeWidth="2.2" fill="none" />
      <path d="M56 14 L62 11 L63 19 Z" fill="#2f6b46" />
      <path d="M14 44 L66 44" stroke="#454d54" strokeWidth="2" fill="none" />
    </>
  ),
};
