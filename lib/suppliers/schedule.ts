// Vercel cron uses UTC. Candidate UTC hours cover both Romanian offsets;
// the route accepts only the two local hours, including daylight-saving changes.
export function isSupplierSyncHour(date: Date): boolean {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Bucharest",
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return hour === "06" || hour === "18";
}
