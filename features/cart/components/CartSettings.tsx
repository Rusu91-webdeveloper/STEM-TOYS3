"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Clock,
  Database,
  Trash2,
  RefreshCw,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import {
  getCartPreferences,
  setCartPreferences,
  clearCartStorage,
  getCartAgeInfo,
  devClearAllCartData,
  type CartStoragePreferences,
} from "../lib/cartStorage";

interface CartSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSettings({ isOpen, onClose }: CartSettingsProps) {
  const { t } = useTranslation();
  const [preferences, setPreferencesState] =
    useState<CartStoragePreferences | null>(null);
  const [cartAge, setCartAge] = useState<{
    hoursOld: number;
    isOld: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const prefs = getCartPreferences();
      const age = getCartAgeInfo();
      setPreferencesState(prefs);
      setCartAge(age);
      setIsLoading(false);
    }
  }, [isOpen]);

  const updatePreference = (key: keyof CartStoragePreferences, value: any) => {
    if (!preferences) return;

    const updated = { ...preferences, [key]: value };
    setPreferencesState(updated);
    setCartPreferences({ [key]: value });
  };

  const handleClearCart = () => {
    clearCartStorage();
    setCartAge(null);
    // Trigger a page refresh to reload cart state
    window.location.reload();
  };

  const handleDevClear = () => {
    devClearAllCartData();
    setCartAge(null);
    // Trigger a page refresh to reset everything
    window.location.reload();
  };

  if (!isOpen || !preferences) return null;

  const persistenceModes = [
    {
      value: "smart",
      label: "Smart Mode (Recommended)",
      description: "Automatically manages cart with expiry and smart clearing",
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    {
      value: "session",
      label: "Session Only",
      description: "Cart clears when you close the browser tab",
      icon: <RefreshCw className="h-4 w-4 text-blue-500" />,
    },
    {
      value: "persistent",
      label: "Always Save",
      description: "Cart persists until manually cleared",
      icon: <Database className="h-4 w-4 text-indigo-500" />,
    },
    {
      value: "disabled",
      label: "Never Save",
      description: "Cart resets on every page load",
      icon: <Trash2 className="h-4 w-4 text-red-500" />,
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
      <div className="relative max-w-md w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-white" />
              <h2 className="text-xl font-bold text-white">Cart Settings</h2>
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
          {/* Cart Age Info */}
          {cartAge && (
            <div
              className={`p-4 rounded-lg border-2 ${
                cartAge.isOld
                  ? "bg-amber-50 border-amber-200"
                  : "bg-green-50 border-green-200"
              }`}>
              <div className="flex items-center gap-2 mb-2">
                {cartAge.isOld ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                ) : (
                  <Clock className="h-5 w-5 text-green-600" />
                )}
                <span
                  className={`font-medium ${
                    cartAge.isOld ? "text-amber-800" : "text-green-800"
                  }`}>
                  Cart Age: {cartAge.hoursOld} hours
                </span>
              </div>
              <p
                className={`text-sm ${
                  cartAge.isOld ? "text-amber-700" : "text-green-700"
                }`}>
                {cartAge.isOld
                  ? "Your cart items are getting old. Consider clearing them if no longer needed."
                  : "Your cart items are recent and fresh."}
              </p>
            </div>
          )}

          {/* Persistence Mode */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Cart Persistence Mode
            </h3>
            <div className="space-y-3">
              {persistenceModes.map((mode) => (
                <label
                  key={mode.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    preferences.persistenceMode === mode.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50"
                  }`}>
                  <input
                    type="radio"
                    name="persistenceMode"
                    value={mode.value}
                    checked={preferences.persistenceMode === mode.value}
                    onChange={(e) =>
                      updatePreference("persistenceMode", e.target.value)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {mode.icon}
                      <span className="font-medium text-gray-900">
                        {mode.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{mode.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Auto Expiry (only for smart/persistent modes) */}
          {(preferences.persistenceMode === "smart" ||
            preferences.persistenceMode === "persistent") && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Auto-Clear After
              </h3>
              <div className="space-y-2">
                {[1, 4, 12, 24, 48, 168].map((hours) => (
                  <label
                    key={hours}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      preferences.autoExpiry === hours
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <input
                      type="radio"
                      name="autoExpiry"
                      value={hours}
                      checked={preferences.autoExpiry === hours}
                      onChange={(e) =>
                        updatePreference("autoExpiry", parseInt(e.target.value))
                      }
                    />
                    <span className="text-gray-900">
                      {hours === 1
                        ? "1 hour"
                        : hours === 168
                          ? "1 week"
                          : hours < 24
                            ? `${hours} hours`
                            : `${hours / 24} day${hours / 24 > 1 ? "s" : ""}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Additional Options */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Additional Options
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="font-medium text-gray-900">
                    Clear cart after checkout
                  </span>
                  <p className="text-sm text-gray-600">
                    Automatically clear cart when order is completed
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.clearOnCheckout}
                  onChange={(e) =>
                    updatePreference("clearOnCheckout", e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="font-medium text-gray-900">
                    Clear cart on logout
                  </span>
                  <p className="text-sm text-gray-600">
                    Clear cart when you sign out of your account
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.clearOnLogout}
                  onChange={(e) =>
                    updatePreference("clearOnLogout", e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleClearCart}
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Current Cart
            </Button>

            {process.env.NODE_ENV === "development" && (
              <Button
                onClick={handleDevClear}
                variant="outline"
                className="w-full text-orange-600 border-orange-200 hover:bg-orange-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Dev: Clear All Data
              </Button>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Smart Mode (Recommended)</p>
                  <p>
                    Provides the best balance between convenience and
                    performance. Your cart will persist across sessions but
                    automatically clean up old items.
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
