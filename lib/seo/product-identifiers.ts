/** Accept GTIN-8/12/13/14 only when the GS1 check digit is valid. */
export function validGtin(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value) ||
    /^0+$/.test(value)
  )
    return null;
  let sum = 0;
  for (
    let index = value.length - 2, offset = 0;
    index >= 0;
    index--, offset++
  ) {
    sum += Number(value[index]) * (offset % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === Number(value.at(-1)) ? value : null;
}
