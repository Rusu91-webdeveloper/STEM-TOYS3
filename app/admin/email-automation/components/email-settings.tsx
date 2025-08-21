"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export function EmailSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Settings</h2>
          <p className="text-muted-foreground">
            Configure email automation settings and preferences
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <Card className="text-center py-12">
        <CardContent>
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Settings Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            Email automation settings and configuration features are currently
            under development.
          </p>
          <Button disabled>
            <Settings className="h-4 w-4 mr-2" />
            Configure Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
