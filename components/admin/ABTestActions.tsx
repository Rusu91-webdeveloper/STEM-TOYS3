"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pause, Play, StopCircle } from "lucide-react";
import { ABTestWithVariants } from "@/lib/services/ab-testing-service";
import { useRouter } from "next/navigation";

interface ABTestActionsProps {
  test: ABTestWithVariants;
}

export function ABTestActions({ test }: ABTestActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (action: "start" | "pause" | "stop") => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/ab-testing?testId=${test.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: action }),
      });

      if (!response.ok) {
        throw new Error("Failed to update test status");
      }

      // Refresh the page to show updated status
      router.refresh();
    } catch (error) {
      console.error("Error updating test status:", error);
      alert("Failed to update test status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2 pt-2">
      {test.status === "RUNNING" && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange("pause")}
            disabled={isLoading}
          >
            <Pause className="h-3 w-3 mr-1" />
            Pause
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange("stop")}
            disabled={isLoading}
          >
            <StopCircle className="h-3 w-3 mr-1" />
            Stop
          </Button>
        </>
      )}
      {test.status === "PAUSED" && (
        <Button
          size="sm"
          onClick={() => handleStatusChange("start")}
          disabled={isLoading}
        >
          <Play className="h-3 w-3 mr-1" />
          Resume
        </Button>
      )}
      {test.status === "DRAFT" && (
        <Button
          size="sm"
          onClick={() => handleStatusChange("start")}
          disabled={isLoading}
        >
          <Play className="h-3 w-3 mr-1" />
          Start Test
        </Button>
      )}
      <Button size="sm" variant="outline">
        View Details
      </Button>
    </div>
  );
}
