const SEPARATORS = /[\s\-().]/g;

/**
 * Match key for Romanian phones. Strips spaces and dashes, folds +40 / 0040 / 40
 * into a national 0-prefix, then keeps the last 9 digits.
 */
export function romanianPhoneMatchKey(
  phone: string | null | undefined
): string | null {
  if (!phone) return null;
  let compact = phone.trim().replace(SEPARATORS, "");
  if (!compact) return null;

  if (compact.startsWith("+40")) {
    compact = `0${compact.slice(3)}`;
  } else if (compact.startsWith("0040")) {
    compact = `0${compact.slice(4)}`;
  } else if (compact.startsWith("40")) {
    const digitsOnly = compact.replace(/\D/g, "");
    if (digitsOnly.length >= 11) {
      compact = `0${compact.slice(2)}`;
    }
  }

  const digits = compact.replace(/\D/g, "");
  if (digits.length < 9) return null;
  return digits.slice(-9);
}
