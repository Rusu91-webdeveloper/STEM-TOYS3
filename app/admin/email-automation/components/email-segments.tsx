"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export function EmailSegments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Segments</h2>
          <p className="text-muted-foreground">
            Create and manage customer segments for targeted email campaigns
          </p>
        </div>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Create Segment
        </Button>
      </div>

      <Card className="text-center py-12">
        <CardContent>
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Segments Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            Customer segmentation features are currently under development.
          </p>
          <Button disabled>
            <Users className="h-4 w-4 mr-2" />
            Create Segment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
