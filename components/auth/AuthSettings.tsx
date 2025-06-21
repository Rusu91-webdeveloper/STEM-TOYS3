"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Zap,
  UserCheck,
  Trash2,
  RefreshCw,
  Info,
  CheckCircle,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import {
  getAuthPreferences,
  setAuthPreferences,
  clearAuthCookies,
  devClearAllAuthData,
  getAuthSystemStatus,
  type AuthPreferences,
} from "@/lib/auth/smartSessionManager";

interface AuthSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthSettings({ isOpen, onClose }: AuthSettingsProps) {
  const { t } = useTranslation();
  const [preferences, setPreferencesState] = useState<AuthPreferences | null>(
    null
  );
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const prefs = getAuthPreferences();
      const status = getAuthSystemStatus();
      setPreferencesState(prefs);
      setAuthStatus(status);
      setIsLoading(false);
    }
  }, [isOpen]);

  const updatePreference = (key: keyof AuthPreferences, value: any) => {
    if (!preferences) return;

    const updated = { ...preferences, [key]: value };
    setPreferencesState(updated);
    setAuthPreferences({ [key]: value });
  };

  const handleClearAuthData = () => {
    clearAuthCookies();
    // Refresh page to reload auth state
    window.location.reload();
  };

  const handleDevClear = () => {
    devClearAllAuthData();
    // Refresh page to reset everything
    window.location.reload();
  };

  if (!isOpen || !preferences) return null;

  const validationOptions = [
    {
      value: "minimal",
      label: "Minimal (10 min)",
      description: "Check session every 10 minutes - Best performance",
      icon: <Zap className="h-4 w-4 text-green-500" />,
    },
    {
      value: "normal",
      label: "Normal (5 min)",
      description: "Balanced security and performance",
      icon: <CheckCircle className="h-4 w-4 text-blue-500" />,
    },
    {
      value: "frequent",
      label: "Frequent (2 min)",
      description: "Check session every 2 minutes - Most secure",
      icon: <Shield className="h-4 w-4 text-red-500" />,
    },
  ];

  const redirectOptions = [
    {
      value: "manual",
      label: "Manual",
      description: "Never auto-redirect, user controls navigation",
      icon: <UserCheck className="h-4 w-4 text-green-500" />,
    },
    {
      value: "smart",
      label: "Smart (Recommended)",
      description: "Intelligent redirects that avoid loops",
      icon: <CheckCircle className="h-4 w-4 text-blue-500" />,
    },
    {
      value: "aggressive",
      label: "Aggressive",
      description: "Always redirect authenticated users",
      icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Settings Panel */}
      <div className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-white" />
              <h2 className="text-xl font-bold text-white">Auth Settings</h2>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 rounded-full p-2">
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Auth Status Info */}
          {authStatus?.sessionState && (
            <div
              className={`p-4 rounded-lg border-2 ${
                authStatus.sessionState.isValid
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}>
              <div className="flex items-center gap-2 mb-2">
                {authStatus.sessionState.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                <span
                  className={`font-medium ${
                    authStatus.sessionState.isValid
                      ? "text-green-800"
                      : "text-red-800"
                  }`}>
                  Session Status:{" "}
                  {authStatus.sessionState.isValid ? "Valid" : "Invalid"}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  Validation attempts:{" "}
                  {authStatus.sessionState.validationAttempts}
                </p>
                {authStatus.sessionState.lastValidated && (
                  <p>
                    Last validated:{" "}
                    {Math.round(
                      (Date.now() - authStatus.sessionState.lastValidated) /
                        1000 /
                        60
                    )}{" "}
                    min ago
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Auto-Login Toggle */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Auto-Login Behavior
            </h3>
            <label className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-gray-300">
              <div className="flex items-center gap-3">
                {preferences.autoLogin ? (
                  <Unlock className="h-5 w-5 text-green-600" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-600" />
                )}
                <div>
                  <span className="font-medium text-gray-900">
                    Enable Auto-Login
                  </span>
                  <p className="text-sm text-gray-600">
                    {preferences.autoLogin
                      ? "You'll be automatically redirected when already logged in"
                      : "Manual navigation - you control when to redirect"}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.autoLogin}
                onChange={(e) =>
                  updatePreference("autoLogin", e.target.checked)
                }
                className="rounded border-gray-300 h-5 w-5"
              />
            </label>
          </div>

          {/* Validation Frequency */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Session Validation Frequency
            </h3>
            <div className="space-y-3">
              {validationOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    preferences.validationFrequency === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50"
                  }`}>
                  <input
                    type="radio"
                    name="validationFrequency"
                    value={option.value}
                    checked={preferences.validationFrequency === option.value}
                    onChange={(e) =>
                      updatePreference("validationFrequency", e.target.value)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {option.icon}
                      <span className="font-medium text-gray-900">
                        {option.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Redirect Behavior (only when auto-login is enabled) */}
          {preferences.autoLogin && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Redirect Behavior
              </h3>
              <div className="space-y-3">
                {redirectOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      preferences.redirectBehavior === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50"
                    }`}>
                    <input
                      type="radio"
                      name="redirectBehavior"
                      value={option.value}
                      checked={preferences.redirectBehavior === option.value}
                      onChange={(e) =>
                        updatePreference("redirectBehavior", e.target.value)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {option.icon}
                        <span className="font-medium text-gray-900">
                          {option.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Session Persistence */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Session Persistence
            </h3>
            <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
              <div>
                <span className="font-medium text-gray-900">
                  Persist sessions
                </span>
                <p className="text-sm text-gray-600">
                  Keep session data across browser restarts
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.persistSession}
                onChange={(e) =>
                  updatePreference("persistSession", e.target.checked)
                }
                className="rounded border-gray-300"
              />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleClearAuthData}
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Auth Cookies
            </Button>

            {process.env.NODE_ENV === "development" && (
              <Button
                onClick={handleDevClear}
                variant="outline"
                className="w-full text-orange-600 border-orange-200 hover:bg-orange-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Dev: Clear All Auth Data
              </Button>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Performance Impact</p>
                  <p>
                    Auto-login disabled and minimal validation provide the best
                    performance. Smart redirect behavior prevents annoying
                    redirect loops.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
