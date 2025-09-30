/**
 * Facebook Pixel Analytics Dashboard for Romanian Viral Tracking
 *
 * Admin dashboard to monitor Facebook Pixel events, Romanian viral content
 * spread, and conversion tracking from blog traffic to sales
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
  TrendingUp,
  Share2,
  Users,
  Target,
  DollarSign,
  BarChart3,
  RefreshCw,
  Facebook,
  Instagram,
} from "lucide-react";

// Import Facebook Pixel service
import {
  facebookPixelService,
  RomanianViralTrackingData,
} from "@/lib/services/facebook-pixel-service";

async function getFacebookAnalytics(): Promise<{
  overview: {
    totalEvents: number;
    viralShares: number;
    blogEngagements: number;
    purchasesFromBlog: number;
    totalRevenue: number;
  };
  viralData: RomanianViralTrackingData[];
  recentEvents: Array<{
    event: string;
    blogId?: string;
    platform?: string;
    timestamp: string;
    value?: number;
  }>;
}> {
  try {
    // Mock data for development - would fetch from Facebook Insights API
    return {
      overview: {
        totalEvents: 15420,
        viralShares: 892,
        blogEngagements: 3456,
        purchasesFromBlog: 127,
        totalRevenue: 45280,
      },
      viralData: [
        {
          blogId: "stem-beneficii-copii-2025",
          shares: 247,
          facebookShares: 189,
          viralCoefficient: 1.8,
          reach: 15420,
          engagement: 892,
          timeSpent: 4.2,
          romanianEngagement: 734,
        },
        {
          blogId: "jucarii-stem-matematica",
          shares: 198,
          facebookShares: 145,
          viralCoefficient: 2.1,
          reach: 12350,
          engagement: 756,
          timeSpent: 5.1,
          romanianEngagement: 623,
        },
      ],
      recentEvents: [
        {
          event: "ViralShare",
          blogId: "stem-beneficii-copii-2025",
          platform: "facebook",
          timestamp: new Date().toISOString(),
        },
        {
          event: "Purchase",
          blogId: "jucarii-stem-matematica",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          value: 299,
        },
        {
          event: "BlogEngagement",
          blogId: "programare-copii-6-ani",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    };
  } catch (error) {
    console.error("Failed to fetch Facebook analytics:", error);
    return {
      overview: {
        totalEvents: 0,
        viralShares: 0,
        blogEngagements: 0,
        purchasesFromBlog: 0,
        totalRevenue: 0,
      },
      viralData: [],
      recentEvents: [],
    };
  }
}

function AnalyticsSkeleton() {
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewCards({
  data,
}: {
  data: Awaited<ReturnType<typeof getFacebookAnalytics>>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.overview.totalEvents.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Romanian audience events
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Viral Shares</CardTitle>
          <Share2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.overview.viralShares.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Blog shares on social media
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Blog Engagements
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.overview.blogEngagements.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Romanian reader interactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Revenue from Blog
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.overview.totalRevenue.toLocaleString()} RON
          </div>
          <p className="text-xs text-muted-foreground">
            From viral blog traffic
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ViralContentTable({
  viralData,
}: {
  viralData: RomanianViralTrackingData[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Romanian Viral Content Performance</CardTitle>
        <CardDescription>
          How your blog posts are spreading across Romanian social media
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {viralData.map(blog => (
            <div
              key={blog.blogId}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">
                  {blog.blogId.replace(/-/g, " ")}
                </div>
                <div className="text-sm text-muted-foreground">
                  Reach: {blog.reach.toLocaleString()} | Time: {blog.timeSpent}
                  min
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">{blog.shares}</div>
                  <div className="text-muted-foreground">Shares</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{blog.viralCoefficient}</div>
                  <div className="text-muted-foreground">Viral Coef</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{blog.romanianEngagement}</div>
                  <div className="text-muted-foreground">Engagement</div>
                </div>
                <Badge
                  variant={
                    blog.viralCoefficient >= 1.5 ? "default" : "secondary"
                  }
                >
                  {blog.viralCoefficient >= 1.5 ? "High Viral" : "Medium Viral"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentEventsTable({
  events,
}: {
  events: Awaited<ReturnType<typeof getFacebookAnalytics>>["recentEvents"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Romanian Events</CardTitle>
        <CardDescription>
          Latest Facebook Pixel events from Romanian users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                {event.event === "ViralShare" && (
                  <Share2 className="h-4 w-4 text-blue-500" />
                )}
                {event.event === "Purchase" && (
                  <DollarSign className="h-4 w-4 text-green-500" />
                )}
                {event.event === "BlogEngagement" && (
                  <Users className="h-4 w-4 text-purple-500" />
                )}
                <div>
                  <div className="font-medium">{event.event}</div>
                  {event.blogId && (
                    <div className="text-sm text-muted-foreground">
                      Blog: {event.blogId}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {event.platform && (
                  <Badge variant="outline">
                    {event.platform === "facebook" && (
                      <Facebook className="h-3 w-3 mr-1" />
                    )}
                    {event.platform === "instagram" && (
                      <Instagram className="h-3 w-3 mr-1" />
                    )}
                    {event.platform}
                  </Badge>
                )}
                {event.value && (
                  <Badge variant="secondary">{event.value} RON</Badge>
                )}
                <div className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function FacebookPixelPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Facebook Pixel Analytics
          </h1>
          <p className="text-muted-foreground">
            Monitor Romanian viral content spread and conversion tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          Facebook Pixel integration is active for Romanian viral content
          tracking. Connect Conversions API for enhanced server-side tracking.
        </AlertDescription>
      </Alert>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <FacebookAnalyticsContent />
      </Suspense>
    </div>
  );
}

async function FacebookAnalyticsContent() {
  const data = await getFacebookAnalytics();

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="viral">Viral Content</TabsTrigger>
        <TabsTrigger value="events">Recent Events</TabsTrigger>
        <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <OverviewCards data={data} />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Romanian Market Insights</CardTitle>
              <CardDescription>
                Key metrics for viral content success in Romania
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Viral Share Rate</span>
                  <span className="text-sm font-bold text-green-600">
                    {(
                      (data.overview.viralShares / data.overview.totalEvents) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Blog to Purchase Rate
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {(
                      (data.overview.purchasesFromBlog /
                        data.overview.blogEngagements) *
                      100
                    ).toFixed(2)}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Revenue per Engagement
                  </span>
                  <span className="text-sm font-bold text-purple-600">
                    {data.overview.blogEngagements > 0
                      ? (
                          data.overview.totalRevenue /
                          data.overview.blogEngagements
                        ).toFixed(0)
                      : "0"}{" "}
                    RON
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Distribution</CardTitle>
              <CardDescription>
                Viral shares by social platform in Romania
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Facebook</span>
                  </div>
                  <span className="text-sm font-medium">68%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Instagram className="h-4 w-4 text-pink-600" />
                    <span className="text-sm">Instagram</span>
                  </div>
                  <span className="text-sm font-medium">24%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Other Platforms</span>
                  <span className="text-sm font-medium">8%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="viral" className="space-y-6">
        <ViralContentTable viralData={data.viralData} />
      </TabsContent>

      <TabsContent value="events" className="space-y-6">
        <RecentEventsTable events={data.recentEvents} />
      </TabsContent>

      <TabsContent value="conversion" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Romanian Conversion Funnel</CardTitle>
            <CardDescription>
              From viral blog views to purchases in the Romanian market
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">Blog Views</span>
                </div>
                <span className="text-lg font-bold">
                  {data.overview.totalEvents.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Product Views from Blog</span>
                </div>
                <span className="text-lg font-bold">
                  {data.overview.blogEngagements.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">Add to Cart</span>
                </div>
                <span className="text-lg font-bold">
                  {Math.round(
                    data.overview.purchasesFromBlog * 2.5
                  ).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="font-medium">Purchases</span>
                </div>
                <span className="text-lg font-bold">
                  {data.overview.purchasesFromBlog.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
