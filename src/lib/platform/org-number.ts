/** Swedish organisation number: ten digits, Luhn from the left (2-1-2-1). */

export function digitsOfOrgNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function formatOrgNumber(digits: string): string {
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

function luhnCheckDigit(nine: string): number {
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    let value = Number(nine[i]) * (i % 2 === 0 ? 2 : 1);
    if (value > 9) value -= 9;
    sum += value;
  }
  return (10 - (sum % 10)) % 10;
}

export function orgNumberError(raw: string): string | null {
  const digits = digitsOfOrgNumber(raw);
  if (!digits) return "The organisation number is missing.";
  if (digits.length !== 10) return "The organisation number must be ten digits.";
  if (luhnCheckDigit(digits.slice(0, 9)) !== Number(digits[9])) {
    return "The organisation number does not check out. Check the digits.";
  }
  return null;
}

export function normalizeOrgNumber(raw: string): string | null {
  if (orgNumberError(raw)) return null;
  return formatOrgNumber(digitsOfOrgNumber(raw));
}

/** Deterministic valid number for tests. Not a real company. */
export function makeOrgNumber(seed: number): string {
  const nine = `5561${String(10_000 + (Math.abs(seed) % 10_000)).slice(-5)}`;
  return formatOrgNumber(`${nine}${String(luhnCheckDigit(nine))}`);
}
