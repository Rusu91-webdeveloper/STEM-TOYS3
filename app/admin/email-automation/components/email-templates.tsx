"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

export function EmailTemplates() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground">
            Create and manage reusable email templates
          </p>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Card className="text-center py-12">
        <CardContent>
          <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Templates Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            Email template management features are currently under development.
          </p>
          <Button disabled>
            <Edit className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
