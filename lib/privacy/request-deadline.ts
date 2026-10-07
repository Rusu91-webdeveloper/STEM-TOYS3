/** One calendar month from the recorded UTC receipt, independent of the
 * server's timezone. Clamp month-end rather than promising fixed 30 days. */
export function privacyRequestDeadline(
  createdAt: Date | string,
  now = new Date()
) {
  const responseDueAt = new Date(createdAt);
  const day = responseDueAt.getUTCDate();
  responseDueAt.setUTCDate(1);
  responseDueAt.setUTCMonth(responseDueAt.getUTCMonth() + 1);
  const lastDay = new Date(
    Date.UTC(responseDueAt.getUTCFullYear(), responseDueAt.getUTCMonth() + 1, 0)
  ).getUTCDate();
  responseDueAt.setUTCDate(Math.min(day, lastDay));
  return {
    responseDueAt: responseDueAt.toISOString(),
    overdue: now > responseDueAt,
  };
}
