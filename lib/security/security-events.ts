import { prisma } from "@/lib/prisma";
import { SecurityEventType } from "@prisma/client";

interface SecurityEventData {
  userId?: string;
  eventType: SecurityEventType;
  ipAddress?: string;
  userAgent?: string;
  location?: any;
  details?: any;
  success: boolean;
  riskScore?: number;
  sessionId?: string;
  metadata?: any;
}

export async function logSecurityEvent(eventData: SecurityEventData) {
  try {
    // Calculate risk score based on event type and patterns
    const riskScore = calculateRiskScore(eventData);

    await prisma.securityEventLog.create({
      data: {
        userId: eventData.userId,
        eventType: eventData.eventType,
        ipAddress: eventData.ipAddress,
        userAgent: eventData.userAgent,
        location: eventData.location,
        details: eventData.details,
        success: eventData.success,
        riskScore,
        sessionId: eventData.sessionId,
        metadata: eventData.metadata,
      },
    });

    // Check for suspicious activity patterns
    if (riskScore > 70) {
      await handleSuspiciousActivity(eventData);
    }
  } catch (error) {
    console.error("Failed to log security event:", error);
    // Don't throw error to avoid breaking the main flow
  }
}

function calculateRiskScore(eventData: SecurityEventData): number {
  let score = 0;

  switch (eventData.eventType) {
    case "LOGIN_FAILED":
      score += 30;
      break;
    case "ACCOUNT_LOCKOUT":
      score += 50;
      break;
    case "SUSPICIOUS_ACTIVITY":
      score += 80;
      break;
    case "PASSWORD_RESET_REQUEST":
      score += 20;
      break;
    case "ACCOUNT_RECOVERY":
      score += 40;
      break;
    default:
      score += 10;
  }

  // Add score based on location changes
  if (eventData.location && eventData.details?.previousLocation) {
    // Check for suspicious location changes
    const prevLocation = eventData.details.previousLocation;
    const currentLocation = eventData.location;

    if (prevLocation.country !== currentLocation.country) {
      score += 25; // International travel
    }

    if (prevLocation.city !== currentLocation.city) {
      score += 15; // City change
    }
  }

  // Cap at 100
  return Math.min(score, 100);
}

async function handleSuspiciousActivity(eventData: SecurityEventData) {
  // Implement alerting logic here
  // This could send emails, Slack notifications, etc.
  console.warn("Suspicious activity detected:", {
    userId: eventData.userId,
    eventType: eventData.eventType,
    riskScore: eventData.riskScore,
    ipAddress: eventData.ipAddress,
  });

  // TODO: Implement actual alerting (email, Slack, etc.)
}

export async function getSecurityEvents(userId: string, limit = 50) {
  return prisma.securityEventLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      eventType: true,
      success: true,
      riskScore: true,
      createdAt: true,
      details: true,
      ipAddress: true,
    },
  });
}

export async function getRecentFailedLogins(userId: string, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return prisma.securityEventLog.count({
    where: {
      userId,
      eventType: "LOGIN_FAILED",
      createdAt: { gte: since },
    },
  });
}
