/**
 * Content Calendar Service for Automated Romanian STEM Publishing
 *
 * Advanced content scheduling system optimized for Romanian market viral success,
 * including optimal publishing times, seasonal content, and automated workflows
 */

export interface ContentCalendarEntry {
  id: string;
  title: string;
  type: "blog" | "social" | "email" | "video" | "infographic";
  status: "draft" | "scheduled" | "published" | "failed";
  content?: string;
  excerpt?: string;
  tags?: string[];
  targetKeywords?: string[];
  scheduledDate: Date;
  publishedDate?: Date;
  authorId?: string;
  categoryId?: string;
  stemCategory?: string;
  targetAudience:
    | "romanian_parents"
    | "romanian_teachers"
    | "romanian_students"
    | "general";
  priority: "high" | "medium" | "low";
  viralPotential: number; // 1-10 scale
  seasonalContext?:
    | "back_to_school"
    | "winter_holidays"
    | "summer_break"
    | "exam_season"
    | "regular";
  regionalFocus?:
    | "bucharest"
    | "cluj"
    | "timisoara"
    | "iasi"
    | "constanta"
    | "national";
  socialPromotion: boolean;
  emailPromotion: boolean;
  crossPromotion: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublishingSchedule {
  optimalTimes: {
    day: string;
    hour: number;
    expectedTraffic: number;
    romanianTimezone: boolean;
  }[];
  contentTypes: {
    type: string;
    frequency: string;
    optimalDays: string[];
  }[];
  seasonalCalendar: {
    period: string;
    focus: string;
    contentTypes: string[];
  }[];
}

export interface ContentCalendarAnalytics {
  totalScheduled: number;
  totalPublished: number;
  averageViralScore: number;
  topPerformingContent: ContentCalendarEntry[];
  publishingEfficiency: number;
  audienceEngagement: number;
  conversionRate: number;
}

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class ContentCalendarService {
  private static readonly ROMANIAN_OPTIMAL_TIMES = [
    { day: "Monday", hour: 19, expectedTraffic: 85, romanianTimezone: true },
    { day: "Tuesday", hour: 20, expectedTraffic: 92, romanianTimezone: true },
    { day: "Wednesday", hour: 19, expectedTraffic: 88, romanianTimezone: true },
    { day: "Thursday", hour: 18, expectedTraffic: 95, romanianTimezone: true },
    { day: "Friday", hour: 17, expectedTraffic: 78, romanianTimezone: true },
    { day: "Saturday", hour: 10, expectedTraffic: 65, romanianTimezone: true },
    { day: "Sunday", hour: 16, expectedTraffic: 72, romanianTimezone: true },
  ];

  /**
   * Create a new content calendar entry
   */
  static async scheduleContent(
    entry: Omit<ContentCalendarEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<ContentCalendarEntry> {
    // Validate scheduling date
    if (entry.scheduledDate <= new Date()) {
      throw new Error("Scheduled date must be in the future");
    }

    // Auto-assign viral potential based on content analysis
    const viralPotential = this.calculateViralPotential(entry);

    const calendarEntry: ContentCalendarEntry = {
      ...entry,
      id: `calendar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      viralPotential,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In production, save to database
    console.log("Scheduled content:", calendarEntry);

    return calendarEntry;
  }

  /**
   * Generate Romanian STEM content calendar for a month
   */
  async generateMonthlyCalendar(
    year: number,
    month: number
  ): Promise<ContentCalendarEntry[]> {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Fetch published blogs in this month
    const blogs = await db.blog.findMany({
      where: {
        isPublished: true,
        publishedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { publishedAt: "asc" },
      select: {
        id: true,
        title: true,
        excerpt: true,
        tags: true,
        publishedAt: true,
        stemCategory: true,
        viralScore: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Fetch email campaigns that are scheduled or sent in this month
    const emailCampaigns = await db.emailCampaign.findMany({
      where: {
        OR: [
          {
            status: "SCHEDULED",
            scheduledAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          {
            status: "SENT",
            sentAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        ],
      },
      orderBy: [{ scheduledAt: "asc" }, { sentAt: "asc" }],
      select: {
        id: true,
        name: true,
        subject: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const calendar: ContentCalendarEntry[] = [
      // Map blogs as published entries
      ...blogs.map(b => ({
        id: b.id,
        title: b.title,
        type: "blog" as const,
        status: "published" as const,
        excerpt: b.excerpt || undefined,
        tags: b.tags || [],
        targetKeywords: [],
        scheduledDate: b.publishedAt || new Date(),
        stemCategory: (b.stemCategory as unknown as string) || undefined,
        targetAudience: "romanian_parents",
        priority: "high",
        viralPotential:
          Number((b.viralScore as unknown as Prisma.Decimal) || 7) || 7,
        seasonalContext: ContentCalendarService.getSeasonalContext(month),
        regionalFocus: "national",
        socialPromotion: true,
        emailPromotion: true,
        crossPromotion: false,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      // Map email campaigns as scheduled/published entries
      ...emailCampaigns.map(
        c =>
          ({
            id: c.id,
            title: c.subject || c.name,
            type: "email" as const,
            status:
              c.status === "SCHEDULED"
                ? ("scheduled" as const)
                : ("published" as const),
            scheduledDate:
              (c.status === "SCHEDULED" ? c.scheduledAt : c.sentAt) ||
              new Date(),
            targetAudience: "romanian_parents",
            priority: "medium" as const,
            viralPotential: 6,
            socialPromotion: false,
            emailPromotion: true,
            crossPromotion: false,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          }) as ContentCalendarEntry
      ),
    ].sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

    return calendar;
  }

  /**
   * Get optimal publishing times for Romanian audience
   */
  static getOptimalPublishingTimes(): PublishingSchedule {
    return {
      optimalTimes: this.ROMANIAN_OPTIMAL_TIMES,
      contentTypes: [
        {
          type: "blog",
          frequency: "3-4 per week",
          optimalDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        },
        {
          type: "social",
          frequency: "daily",
          optimalDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        },
        {
          type: "email",
          frequency: "bi-weekly",
          optimalDays: ["Tuesday", "Thursday"],
        },
        {
          type: "video",
          frequency: "weekly",
          optimalDays: ["Wednesday"],
        },
      ],
      seasonalCalendar: [
        {
          period: "September-October",
          focus: "Back to School",
          contentTypes: [
            "school preparation",
            "STEM curriculum",
            "parent guides",
          ],
        },
        {
          period: "November-December",
          focus: "Winter Holidays",
          contentTypes: [
            "holiday STEM activities",
            "gift guides",
            "family bonding",
          ],
        },
        {
          period: "January-February",
          focus: "Exam Season",
          contentTypes: [
            "study techniques",
            "stress management",
            "revision guides",
          ],
        },
        {
          period: "March-April",
          focus: "Spring Activities",
          contentTypes: [
            "outdoor STEM",
            "science experiments",
            "nature exploration",
          ],
        },
        {
          period: "May-June",
          focus: "Summer Preparation",
          contentTypes: ["summer camps", "home activities", "skill building"],
        },
        {
          period: "July-August",
          focus: "Summer Break",
          contentTypes: [
            "summer STEM",
            "travel activities",
            "creative projects",
          ],
        },
      ],
    };
  }

  /**
   * Get content calendar analytics
   */
  static async getCalendarAnalytics(): Promise<ContentCalendarAnalytics> {
    // Define a recent window (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    // Published blogs in window
    const [blogs, campaignsScheduled, campaignsSent] = await Promise.all([
      db.blog.findMany({
        where: {
          isPublished: true,
          publishedAt: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          excerpt: true,
          tags: true,
          publishedAt: true,
          viralScore: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 50,
      }),
      db.emailCampaign.count({
        where: {
          status: "SCHEDULED",
          scheduledAt: { gte: start, lte: end },
        },
      }),
      db.emailCampaign.findMany({
        where: {
          status: "SENT",
          sentAt: { gte: start, lte: end },
        },
        orderBy: { sentAt: "desc" },
        select: {
          id: true,
          name: true,
          subject: true,
          sentAt: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 50,
      }),
    ]);

    const totalScheduled = campaignsScheduled;
    const totalPublished = blogs.length + campaignsSent.length;

    const avgViral =
      blogs.length > 0
        ? blogs.reduce(
            (sum, b) =>
              sum + Number((b.viralScore as unknown as Prisma.Decimal) || 0),
            0
          ) / blogs.length
        : 0;

    // Top performing: choose top 5 blogs by viralScore
    const topBlogs = [...blogs]
      .sort(
        (a, b) =>
          Number((b.viralScore as unknown as Prisma.Decimal) || 0) -
          Number((a.viralScore as unknown as Prisma.Decimal) || 0)
      )
      .slice(0, 5)
      .map(b => ({
        id: b.id,
        title: b.title,
        type: "blog" as const,
        status: "published" as const,
        scheduledDate: b.publishedAt || new Date(),
        targetAudience: "romanian_parents" as const,
        priority: "high" as const,
        viralPotential: Number(
          (b.viralScore as unknown as Prisma.Decimal) || 0
        ),
        socialPromotion: true,
        emailPromotion: true,
        crossPromotion: false,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }));

    // Simple heuristics for engagement/conversion until dedicated metrics exist
    const publishingEfficiency =
      totalScheduled > 0 ? Math.min(100, 80 + totalPublished) : 80;
    const audienceEngagement = Math.min(10, avgViral + 2);
    const conversionRate = Math.max(0, Math.min(10, avgViral / 2));

    return {
      totalScheduled,
      totalPublished,
      averageViralScore: Number(avgViral.toFixed(2)),
      topPerformingContent: topBlogs as ContentCalendarEntry[],
      publishingEfficiency,
      audienceEngagement,
      conversionRate,
    };
  }

  /**
   * Auto-publish scheduled content
   */
  static async autoPublishScheduledContent(): Promise<{
    published: ContentCalendarEntry[];
    failed: ContentCalendarEntry[];
  }> {
    // In production, this would run as a cron job
    const now = new Date();
    const published: ContentCalendarEntry[] = [];
    const failed: ContentCalendarEntry[] = [];

    // Mock scheduled content publishing
    console.log("Auto-publishing scheduled content for:", now.toISOString());

    return { published, failed };
  }

  /**
   * Generate viral Romanian title
   */
  private static generateRomanianTitle(
    theme: string,
    seasonalContext?: string
  ): string {
    const viralPrefixes = [
      "ȘOC!",
      "SECRETUL",
      "De ce",
      "NU RATA ȘANSA!",
      "Cum să",
      "8 din 10 Copii",
      "Părinții din Cluj",
    ];

    const themeMappings = {
      matematică: ["Matematica", "Matematică", "Mate"],
      știință: ["Știința", "Experimentele", "Laboratorul"],
      programare: ["Programarea", "Coding-ul", "Roboții"],
      robotică: ["Robotică", "Roboții", "Construcția"],
      părinți: ["Părinții", "Educația", "Dezvoltarea"],
    };

    const prefix =
      viralPrefixes[Math.floor(Math.random() * viralPrefixes.length)];
    const themeWord =
      themeMappings[theme as keyof typeof themeMappings]?.[0] || theme;

    return `${prefix} ${themeWord} pentru Copiii Români în 2025`;
  }

  /**
   * Generate excerpt for content
   */
  private static generateExcerpt(theme: string): string {
    const excerpts = {
      matematică:
        "Descoperă cum să transformi ura față de matematică în pasiune, cu jucăriile STEM care fac matematica distractivă.",
      știință:
        "Experimente științifice acasă care dezvoltă curiozitatea naturală și abilitățile de cercetare ale copiilor tăi.",
      programare:
        "Introdu copiii în lumea programării prin jocuri interactive și proiecte distractive care construiesc viitorul.",
      robotică:
        "Construcție de roboți și proiecte inginerești care dezvoltă gândirea logică și creativitatea tehnică.",
      părinți:
        "Ghid complet pentru părinții români care vor să ofere copiilor cea mai bună educație STEM acasă.",
    };

    return (
      excerpts[theme as keyof typeof excerpts] ||
      `Conținut STEM de calitate pentru dezvoltarea copiilor români în domeniul ${theme}.`
    );
  }

  /**
   * Get optimal publishing time for day of week
   */
  private static getOptimalPublishingTime(dayOfWeek: string) {
    return (
      this.ROMANIAN_OPTIMAL_TIMES.find(time => time.day === dayOfWeek) ||
      this.ROMANIAN_OPTIMAL_TIMES[0]
    ); // Default to Monday
  }

  /**
   * Get seasonal context based on month
   */
  private static getSeasonalContext(
    month: number
  ): ContentCalendarEntry["seasonalContext"] {
    const seasonalMap = {
      8: "back_to_school", // September
      9: "back_to_school", // October
      10: "winter_holidays", // November
      11: "winter_holidays", // December
      0: "exam_season", // January
      1: "exam_season", // February
      6: "summer_break", // July
      7: "summer_break", // August
    };

    return seasonalMap[month as keyof typeof seasonalMap] || "regular";
  }

  /**
   * Calculate content priority
   */
  private static calculatePriority(
    theme: string,
    seasonalContext?: string
  ): "high" | "medium" | "low" {
    if (seasonalContext && seasonalContext !== "regular") return "high";
    if (["matematică", "părinți"].includes(theme)) return "high";
    return "medium";
  }

  /**
   * Get regional focus for content
   */
  private static getRegionalFocus(): ContentCalendarEntry["regionalFocus"] {
    const regions = [
      "bucharest",
      "cluj",
      "timisoara",
      "iasi",
      "constanta",
      "national",
    ];
    return regions[Math.floor(Math.random() * regions.length)] as any;
  }

  /**
   * Calculate viral potential score
   */
  private static calculateViralPotential(
    entry: Omit<
      ContentCalendarEntry,
      "id" | "viralPotential" | "createdAt" | "updatedAt"
    >
  ): number {
    let score = 5; // Base score

    // Title virality factors
    if (entry.title?.includes("ȘOC!") || entry.title?.includes("SECRETUL"))
      score += 2;
    if (entry.title?.includes("Români") || entry.title?.includes("Cluj"))
      score += 1;

    // Seasonal context bonus
    if (entry.seasonalContext && entry.seasonalContext !== "regular")
      score += 1;

    // Target audience relevance
    if (entry.targetAudience === "romanian_parents") score += 1;

    // Priority bonus
    if (entry.priority === "high") score += 1;

    // Social promotion bonus
    if (entry.socialPromotion) score += 0.5;
    if (entry.emailPromotion) score += 0.5;

    return Math.min(10, Math.max(1, score));
  }
}

// Export singleton instance
export const contentCalendarService = new ContentCalendarService();
