const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;

export function tokenFromIssuedPath(path: string): string | null {
  const trimmed = path.trim();
  const token = trimmed.startsWith("/irma/l/") ? trimmed.slice("/irma/l/".length) : trimmed;
  return TOKEN_RE.test(token) ? token : null;
}

export function issuedPathFromCookie(value: string): string | null {
  const token = tokenFromIssuedPath(value);
  return token ? `/irma/l/${token}` : null;
}

export function publicIrmaUrl(path: string, baseUrl: string): string {
  return path.startsWith("http") ? path : `${baseUrl}${path}`;
}
