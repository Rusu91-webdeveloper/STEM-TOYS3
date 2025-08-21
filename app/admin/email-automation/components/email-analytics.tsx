"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export function EmailAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your email marketing
          </p>
        </div>
        <Button variant="outline">Export Report</Button>
      </div>

      <Card className="text-center py-12">
        <CardContent>
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            Advanced email analytics and reporting features are currently under
            development.
          </p>
          <Button disabled>View Analytics</Button>
        </CardContent>
      </Card>
    </div>
  );
}
