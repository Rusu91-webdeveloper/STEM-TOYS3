/** Add calendar days in the supplier's Romanian time zone, including DST. */
export function supplierCalendarDeadline(value: string, days: number): number {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const wallTime = (timestamp: number) => {
    const parts = Object.fromEntries(
      formatter.formatToParts(timestamp).map(part => [part.type, part.value])
    );
    return Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );
  };
  const start = Date.parse(value);
  if (!Number.isFinite(start)) return NaN;
  const target = wallTime(start) + days * 86_400_000;
  let result = target;
  for (let index = 0; index < 3; index++)
    result = target - (wallTime(result) - result);
  return result + (start % 1000);
}
