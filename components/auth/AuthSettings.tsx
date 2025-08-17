"use client";

import {
  Shield,
  Zap,
  UserCheck,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { signOut } from "next-auth/react";
import React, { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOptimizedSession } from "@/lib/auth/SessionContext";
import {
  getAuthPreferences,
  setAuthPreferences,
  clearAuthCookies,
  devClearAllAuthData,
  getAuthSystemStatus,
  type AuthPreferences,
} from "@/lib/auth/smartSessionManager";
import { useTranslation } from "@/lib/i18n";

interface AuthSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthSettings({ isOpen, onClose }: AuthSettingsProps) {
  const [preferences, setPreferencesState] = useState<AuthPreferences | null>(
    null
  );
  const [authStatus, setAuthStatus] = useState<any>(null);
  const { data: session, status } = useOptimizedSession();
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const prefs = getAuthPreferences();
      const status = getAuthSystemStatus();
      setPreferencesState(prefs);
      setAuthStatus(status);
    }
  }, [isOpen]);

  const handleClearSession = async () => {
    setIsClearing(true);
    try {
      // Clear all auth data using the development helper
      devClearAllAuthData();

      // Also sign out through NextAuth
      await signOut({ callbackUrl: "/" });

      // Reload the page to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error("Error clearing session:", error);
    } finally {
      setIsClearing(false);
      onClose();
    }
  };

  const handleForceSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
      // Force redirect if signOut fails
      window.location.href = "/api/auth/clear-session";
    }
  };

  if (!isOpen || !preferences) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Authentication Settings</DialogTitle>
          <DialogDescription>
            View and manage your authentication state
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Session Status */}
          <div className="space-y-2">
            <div className="font-semibold">Session Status</div>
            <div className="flex gap-2">
              <Badge
                variant={status === "authenticated" ? "default" : "secondary"}
              >
                {status}
              </Badge>
              {session?.user?.role && (
                <Badge variant="outline">{session.user.role}</Badge>
              )}
            </div>
          </div>

          {/* User Info */}
          {session?.user && (
            <div className="space-y-2">
              <div className="font-semibold">User Info</div>
              <div className="text-sm space-y-1">
                <div>Email: {session.user.email || "Not available"}</div>
                <div>Name: {session.user.name || "Not available"}</div>
                <div>ID: {session.user.id || "Not available"}</div>
              </div>
            </div>
          )}

          {/* Debug Info */}
          {process.env.NODE_ENV === "development" && (
            <div className="space-y-2">
              <div className="font-semibold">Debug Info</div>
              <div className="text-xs bg-gray-100 p-2 rounded">
                <div>
                  Validation in progress:{" "}
                  {authStatus.validationInProgress ? "Yes" : "No"}
                </div>
                <div>
                  Session valid:{" "}
                  {authStatus.sessionState?.isValid ? "Yes" : "No"}
                </div>
                {authStatus.sessionState?.error && (
                  <div className="text-red-600">
                    Error: {authStatus.sessionState.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <div className="font-semibold">Actions</div>
            <div className="flex flex-col gap-2">
              {status === "authenticated" && (
                <Button
                  onClick={handleForceSignOut}
                  variant="outline"
                  size="sm"
                >
                  Sign Out
                </Button>
              )}

              <Button
                onClick={handleClearSession}
                variant="destructive"
                size="sm"
                disabled={isClearing}
              >
                {isClearing ? "Clearing..." : "Clear All Auth Data"}
              </Button>

              <div className="text-xs text-gray-500">
                Use &quot;Clear All Auth Data&quot; if you&apos;re experiencing
                authentication issues
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
