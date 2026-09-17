/**
 * Phone handling for DollarCash.
 *
 * Accounts are identified by phone number. Auth credentials are keyed to a
 * deterministic internal address derived from the normalized phone, so users
 * only ever type their phone number.
 */

const AUTH_EMAIL_DOMAIN = "dollarcash.app";

/** Digits only, local Pakistani `03xx…` numbers normalized to `92…`. */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  return digits;
}

export function isValidPhone(input: string): boolean {
  const digits = normalizePhone(input);
  return digits.length >= 10 && digits.length <= 15;
}

export function formatPhone(input: string): string {
  return `+${normalizePhone(input)}`;
}

export function phoneToAuthEmail(input: string): string {
  return `${normalizePhone(input)}@${AUTH_EMAIL_DOMAIN}`;
}
