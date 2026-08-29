/** Leftover light chrome from `docs/design/` paper token. No dark theme. */
export const PAPER_HEX = "#fbfbf9";
export const COLOR_SCHEME = "light" as const;
export const LEFTOVER_FORMAT_DETECTION = {
  telephone: false,
  email: false,
  address: false,
} as const;

export function leftoverColorSchemeMeta(): string {
  return `<meta name="color-scheme" content="${COLOR_SCHEME}">`;
}

export function leftoverThemeColorMeta(): string {
  return `<meta name="theme-color" content="${PAPER_HEX}">`;
}

export function leftoverFormatDetectionMeta(): string {
  return '<meta name="format-detection" content="telephone=no, email=no, address=no">';
}
