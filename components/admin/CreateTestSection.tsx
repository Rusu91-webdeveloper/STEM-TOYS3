"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { CreateABTestForm } from "./CreateABTestForm";

export function CreateTestSection() {
  const [showForm, setShowForm] = useState(false);

  if (showForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create New A/B Test</h2>
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </div>
        <CreateABTestForm />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New A/B Test
        </CardTitle>
        <CardDescription>
          Start optimizing your Romanian STEM content with data-driven testing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button
            className="h-20 flex-col gap-2"
            variant="outline"
            onClick={() => setShowForm(true)}
          >
            <span className="text-lg">🎯</span>
            <span>Title Test</span>
          </Button>
          <Button
            className="h-20 flex-col gap-2"
            variant="outline"
            onClick={() => setShowForm(true)}
          >
            <span className="text-lg">📢</span>
            <span>CTA Test</span>
          </Button>
          <Button
            className="h-20 flex-col gap-2"
            variant="outline"
            onClick={() => setShowForm(true)}
          >
            <span className="text-lg">📝</span>
            <span>Content Test</span>
          </Button>
          <Button
            className="h-20 flex-col gap-2"
            variant="outline"
            onClick={() => setShowForm(true)}
          >
            <span className="text-lg">🖼️</span>
            <span>Image Test</span>
          </Button>
          <Button
            className="h-20 flex-col gap-2"
            variant="outline"
            onClick={() => setShowForm(true)}
          >
            <span className="text-lg">🏗️</span>
            <span>Structure Test</span>
          </Button>
          <Button
            className="h-20 flex-col gap-2"
            variant="outline"
            onClick={() => setShowForm(true)}
          >
            <span className="text-lg">⚡</span>
            <span>Custom Test</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
