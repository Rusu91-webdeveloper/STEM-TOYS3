export type OosNotificationChannel =
  | "EMAIL"
  | "PHONE"
  | "WHATSAPP"
  | "SMS"
  | "OTHER";

export type OosNoteEvent = {
  tag: string;
  timestamp?: Date;
  timestampText?: string;
  data: Record<string, string>;
  raw: string;
};

export type OosOpsSnapshot = {
  events: OosNoteEvent[];
  latestDecision?: OosNoteEvent;
  latestNotification?: OosNoteEvent;
  latestResponse?: OosNoteEvent;
  latestReminder?: OosNoteEvent;
  issueAgeHours: number | null;
  inactivityHours: number | null;
  needsCustomerNotification: boolean;
  isSlaOverdue: boolean;
};

export const OOS_SLA_WARNING_HOURS = 24;

export function sanitizeOosNoteValue(value: string | null | undefined) {
  return (value || "").replace(/[;\n\r]+/g, " | ").trim();
}

export function appendOosNoteBlock(existing: string | null, block: string) {
  return [existing, block].filter(Boolean).join("\n\n");
}

export function formatOosEventLabel(tag: string) {
  return tag
    .replace(/^OOS_/, "")
    .toLowerCase()
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseOosNoteEvents(notes?: string | null): OosNoteEvent[] {
  if (!notes) return [];

  return notes
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.startsWith("[OOS_"))
    .map(line => {
      const tagMatch = line.match(/^\[(OOS_[A-Z_]+)\]\s*(.*)$/);
      if (!tagMatch) {
        return {
          tag: "OOS_UNKNOWN",
          raw: line,
          data: {},
        } as OosNoteEvent;
      }

      const [, tag, restRaw] = tagMatch;
      const segments = restRaw
        .split(" ; ")
        .map(seg => seg.trim())
        .filter(Boolean);
      const timestampText = segments[0];
      const parsedTimestamp = timestampText
        ? new Date(timestampText)
        : undefined;
      const timestamp =
        parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime())
          ? parsedTimestamp
          : undefined;

      const data: Record<string, string> = {};
      for (const segment of segments.slice(1)) {
        const idx = segment.indexOf("=");
        if (idx <= 0) continue;
        const key = segment.slice(0, idx).trim();
        const value = segment.slice(idx + 1).trim();
        if (key) data[key] = value;
      }

      return {
        tag,
        timestamp,
        timestampText,
        data,
        raw: line,
      };
    })
    .sort(
      (a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0)
    );
}

export function getLatestOosEvent(events: OosNoteEvent[], tags: string[]) {
  return events.find(event => tags.includes(event.tag));
}

export function getLatestOosReminderByType(
  events: OosNoteEvent[],
  type: string
) {
  return events.find(
    event => event.tag === "OOS_REMINDER_SENT" && event.data.type === type
  );
}

export function hoursSinceDate(date: Date | null | undefined): number | null {
  if (!date || Number.isNaN(date.getTime())) return null;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

export function buildOosOpsSnapshot(input: {
  notes?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  slaWarningHours?: number;
}): OosOpsSnapshot {
  const events = parseOosNoteEvents(input.notes);
  const latestDecision = getLatestOosEvent(events, ["OOS_DECISION"]);
  const latestNotification = getLatestOosEvent(events, [
    "OOS_CUSTOMER_NOTIFIED",
  ]);
  const latestResponse = getLatestOosEvent(events, ["OOS_CUSTOMER_RESPONSE"]);
  const latestReminder = getLatestOosEvent(events, ["OOS_REMINDER_SENT"]);

  const createdAt =
    input.createdAt instanceof Date
      ? input.createdAt
      : input.createdAt
        ? new Date(input.createdAt)
        : null;
  const updatedAt =
    input.updatedAt instanceof Date
      ? input.updatedAt
      : input.updatedAt
        ? new Date(input.updatedAt)
        : null;

  const issueDecisionAt = latestDecision?.timestamp || createdAt;
  const lastActivityAt = updatedAt || createdAt;

  const issueAgeHours = hoursSinceDate(issueDecisionAt);
  const inactivityHours = hoursSinceDate(lastActivityAt);

  const latestDecisionTs = latestDecision?.timestamp?.getTime() ?? 0;
  const latestNotificationTs = latestNotification?.timestamp?.getTime() ?? 0;
  const needsCustomerNotification =
    Boolean(latestDecision) &&
    (!latestNotification || latestNotificationTs < latestDecisionTs);

  const slaThreshold = input.slaWarningHours ?? OOS_SLA_WARNING_HOURS;
  const isSlaOverdue =
    typeof inactivityHours === "number" && inactivityHours >= slaThreshold;

  return {
    events,
    latestDecision,
    latestNotification,
    latestResponse,
    latestReminder,
    issueAgeHours,
    inactivityHours,
    needsCustomerNotification,
    isSlaOverdue,
  };
}
