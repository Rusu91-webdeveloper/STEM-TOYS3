/**
 * Content Calendar Dashboard for Automated Romanian Publishing
 *
 * Admin dashboard to manage automated content scheduling, optimize publishing
 * times for Romanian audiences, and track viral content performance
 */

import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Clock,
  TrendingUp,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  BarChart3,
} from "lucide-react";

// Import content calendar service
import {
  contentCalendarService,
  ContentCalendarEntry,
  PublishingSchedule,
  ContentCalendarAnalytics,
  ContentCalendarService,
} from "@/lib/services/content-calendar-service";

async function getContentCalendarData(): Promise<{
  calendar: ContentCalendarEntry[];
  schedule: PublishingSchedule;
  analytics: ContentCalendarAnalytics;
  upcoming: ContentCalendarEntry[];
}> {
  try {
    // Get current month
    const now = new Date();
    const calendar = await contentCalendarService.generateMonthlyCalendar(
      now.getFullYear(),
      now.getMonth()
    );
    const schedule = ContentCalendarService.getOptimalPublishingTimes();
    const analytics = await ContentCalendarService.getCalendarAnalytics();

    // Get upcoming content (next 7 days)
    const upcoming = calendar
      .filter(entry => {
        const diff = entry.scheduledDate.getTime() - now.getTime();
        return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // Next 7 days
      })
      .slice(0, 10);

    return { calendar, schedule, analytics, upcoming };
  } catch (error) {
    console.error("Failed to fetch content calendar data:", error);
    return {
      calendar: [],
      schedule: ContentCalendarService.getOptimalPublishingTimes(),
      analytics: {
        totalScheduled: 0,
        totalPublished: 0,
        averageViralScore: 0,
        topPerformingContent: [],
        publishingEfficiency: 0,
        audienceEngagement: 0,
        conversionRate: 0,
      },
      upcoming: [],
    };
  }
}

function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function AnalyticsCards({
  analytics,
}: {
  analytics: ContentCalendarAnalytics;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Scheduled Content
          </CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalScheduled}</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Published Content
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analytics.totalPublished}</div>
          <p className="text-xs text-muted-foreground">
            Successfully published
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Viral Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics.averageViralScore.toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">Out of 10.0</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Publishing Efficiency
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {analytics.publishingEfficiency.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">On-time delivery</p>
        </CardContent>
      </Card>
    </div>
  );
}

function PublishingScheduleCard({
  schedule,
}: {
  schedule: PublishingSchedule;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Romanian Optimal Publishing Times</CardTitle>
        <CardDescription>
          Best times to publish content for maximum Romanian audience engagement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedule.optimalTimes.map((time, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{time.day}</div>
                  <div className="text-sm text-muted-foreground">
                    {time.hour}:00 EET
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {time.expectedTraffic}% Traffic
                </div>
                <Badge
                  variant={time.expectedTraffic > 85 ? "default" : "secondary"}
                >
                  {time.expectedTraffic > 90
                    ? "Peak"
                    : time.expectedTraffic > 80
                      ? "High"
                      : "Good"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContentCalendarGrid({
  calendar,
}: {
  calendar: ContentCalendarEntry[];
}) {
  // Group by week
  const weeks = calendar.reduce(
    (acc, entry) => {
      const weekStart = new Date(entry.scheduledDate);
      weekStart.setDate(
        entry.scheduledDate.getDate() - entry.scheduledDate.getDay()
      );
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!acc[weekKey]) acc[weekKey] = [];
      acc[weekKey].push(entry);
      return acc;
    },
    {} as Record<string, ContentCalendarEntry[]>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Content Calendar</CardTitle>
        <CardDescription>
          Automated publishing schedule optimized for Romanian audience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(weeks).map(([weekKey, entries]) => (
            <div key={weekKey} className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">
                Week of{" "}
                {new Date(weekKey).toLocaleDateString("ro-RO", {
                  month: "long",
                  day: "numeric",
                })}
              </h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {entries.map(entry => (
                  <div
                    key={entry.id}
                    className="p-3 border rounded-lg bg-muted/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {entry.type}
                      </Badge>
                      <Badge
                        variant={
                          entry.viralPotential > 8
                            ? "default"
                            : entry.viralPotential > 6
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs"
                      >
                        {entry.viralPotential.toFixed(1)} viral
                      </Badge>
                    </div>
                    <h5 className="font-medium text-sm mb-1 line-clamp-2">
                      {entry.title}
                    </h5>
                    <div className="text-xs text-muted-foreground mb-2">
                      {entry.scheduledDate.toLocaleDateString("ro-RO", {
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          entry.priority === "high"
                            ? "destructive"
                            : entry.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {entry.priority}
                      </Badge>
                      <div className="flex space-x-1">
                        {entry.socialPromotion && (
                          <span className="text-xs">📱</span>
                        )}
                        {entry.emailPromotion && (
                          <span className="text-xs">✉️</span>
                        )}
                        {entry.crossPromotion && (
                          <span className="text-xs">🔗</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingContentCard({
  upcoming,
}: {
  upcoming: ContentCalendarEntry[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Content (Next 7 Days)</CardTitle>
        <CardDescription>
          Content scheduled for publication this week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No content scheduled for the next 7 days
            </p>
          ) : (
            upcoming.map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{entry.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {entry.scheduledDate.toLocaleDateString("ro-RO", {
                      weekday: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {entry.type}
                  </Badge>
                  <Badge
                    variant={
                      entry.status === "scheduled" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {entry.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SeasonalCalendarCard({ schedule }: { schedule: PublishingSchedule }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Romanian Seasonal Content Strategy</CardTitle>
        <CardDescription>
          Content focus areas aligned with Romanian educational calendar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {schedule.seasonalCalendar.map((season, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">{season.period}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {season.focus}
              </p>
              <div className="space-y-1">
                {season.contentTypes.map((type, typeIndex) => (
                  <Badge
                    key={typeIndex}
                    variant="outline"
                    className="text-xs mr-1"
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ContentCalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Content Calendar
          </h1>
          <p className="text-muted-foreground">
            Automated publishing schedule optimized for Romanian viral success
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Calendar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Content
          </Button>
        </div>
      </div>

      <Alert>
        <Calendar className="h-4 w-4" />
        <AlertDescription>
          Content calendar automatically optimizes publishing times for Romanian
          audience engagement. Viral potential scoring ensures maximum social
          media reach.
        </AlertDescription>
      </Alert>

      <Suspense fallback={<CalendarSkeleton />}>
        <ContentCalendarContent />
      </Suspense>
    </div>
  );
}

async function ContentCalendarContent() {
  const { calendar, schedule, analytics, upcoming } =
    await getContentCalendarData();

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
        <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <AnalyticsCards analytics={analytics} />

        <div className="grid gap-6 md:grid-cols-2">
          <UpcomingContentCard upcoming={upcoming} />
          <PublishingScheduleCard schedule={schedule} />
        </div>
      </TabsContent>

      <TabsContent value="calendar" className="space-y-6">
        <ContentCalendarGrid calendar={calendar} />
      </TabsContent>

      <TabsContent value="schedule" className="space-y-6">
        <PublishingScheduleCard schedule={schedule} />

        <Card>
          <CardHeader>
            <CardTitle>Content Type Frequency</CardTitle>
            <CardDescription>
              Optimal publishing frequency for different content types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedule.contentTypes.map((type, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium capitalize">
                      {type.type.replace("_", " ")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {type.frequency}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">Best Days:</div>
                    <div className="text-xs text-muted-foreground">
                      {type.optimalDays.join(", ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seasonal" className="space-y-6">
        <SeasonalCalendarCard schedule={schedule} />
      </TabsContent>
    </Tabs>
  );
}
