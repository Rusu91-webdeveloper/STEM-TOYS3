"use client";

import { Info } from "lucide-react";
import { useOptimizedSession } from "@/lib/auth/SessionContext";

import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Banner component that displays a friendly demo mode message for VISITOR users
 * Shows on admin pages to indicate read-only access
 */
export function DemoModeBanner() {
  const { data: session } = useOptimizedSession();

  // Only show for VISITOR role
  if (session?.user?.role !== "VISITOR") {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Demo Mode - Read Only Access:</strong> You're viewing this admin
        dashboard in demonstration mode. All features and integrations are
        visible to showcase the platform's capabilities, but write operations
        (create, edit, delete) are disabled.
      </AlertDescription>
    </Alert>
  );
}
