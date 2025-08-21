"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Plus } from "lucide-react";

export function EmailCampaigns() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Campaigns</h2>
          <p className="text-muted-foreground">
            Manage one-time email campaigns and broadcasts
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <Card className="text-center py-12">
        <CardContent>
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Campaigns Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            The email campaigns feature is currently under development.
          </p>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
