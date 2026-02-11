export function getCronSecret(): string | null {
  return (
    process.env.CRON_SECRET ||
    process.env.CRON_SECRET_TOKEN ||
    process.env.NEXT_PUBLIC_CRON_SECRET_TOKEN ||
    null
  );
}

export function isAuthorizedCronRequest(authHeader: string | null): boolean {
  const secret = getCronSecret();
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
