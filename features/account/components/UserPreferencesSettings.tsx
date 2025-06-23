"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  Download,
  Trash2,
  Key,
  CreditCard,
  MapPin,
  Globe,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  Camera,
  Save,
  AlertTriangle,
  Check,
  X,
  Settings,
  Database,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  avatar?: string;
  bio?: string;
  joinedAt: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
}

interface NotificationSettings {
  email: {
    newsletter: boolean;
    promotions: boolean;
    orderUpdates: boolean;
    priceAlerts: boolean;
    newProducts: boolean;
    accountSecurity: boolean;
    reviews: boolean;
  };
  push: {
    orderUpdates: boolean;
    priceAlerts: boolean;
    promotions: boolean;
  };
  sms: {
    orderUpdates: boolean;
    deliveryAlerts: boolean;
    securityAlerts: boolean;
  };
}

interface PrivacySettings {
  profileVisibility: "public" | "friends" | "private";
  wishlistVisibility: "public" | "friends" | "private";
  reviewsVisibility: "public" | "private";
  allowDataCollection: boolean;
  allowTargetedAds: boolean;
  allowThirdPartySharing: boolean;
  allowLocationTracking: boolean;
}

interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  language: string;
  currency: string;
  timezone: string;
  fontSize: "small" | "medium" | "large";
  reducedMotion: boolean;
  highContrast: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  trustedDevices: TrustedDevice[];
  recentActivity: SecurityEvent[];
}

interface TrustedDevice {
  id: string;
  name: string;
  type: string;
  lastUsed: Date;
  location: string;
}

interface SecurityEvent {
  id: string;
  type:
    | "login"
    | "logout"
    | "password_change"
    | "email_change"
    | "suspicious_activity";
  description: string;
  timestamp: Date;
  location: string;
  ipAddress: string;
}

interface UserPreferencesSettingsProps {
  className?: string;
}

export function UserPreferencesSettings({
  className,
}: UserPreferencesSettingsProps) {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] =
    useState<NotificationSettings | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [appearance, setAppearance] = useState<AppearanceSettings | null>(null);
  const [security, setSecurity] = useState<SecuritySettings | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Form states
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Load user settings
  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    setIsLoading(true);
    try {
      const [
        profileRes,
        notificationsRes,
        privacyRes,
        appearanceRes,
        securityRes,
      ] = await Promise.all([
        fetch("/api/account/profile"),
        fetch("/api/account/settings/notifications"),
        fetch("/api/account/settings/privacy"),
        fetch("/api/account/settings/appearance"),
        fetch("/api/account/settings/security"),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData);
      }

      if (privacyRes.ok) {
        const privacyData = await privacyRes.json();
        setPrivacy(privacyData);
      }

      if (appearanceRes.ok) {
        const appearanceData = await appearanceRes.json();
        setAppearance(appearanceData);
      }

      if (securityRes.ok) {
        const securityData = await securityRes.json();
        setSecurity(securityData);
      }
    } catch (error) {
      console.error("Failed to load user settings:", error);
      toast({
        title: t("error", "Error"),
        description: t("failedToLoadSettings", "Failed to load settings"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (section: string, data: any) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/account/settings/${section}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: t("settingsSaved", "Settings Saved"),
          description: t(
            "settingsUpdatedSuccessfully",
            "Your settings have been updated successfully"
          ),
        });
        setUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: t("error", "Error"),
        description: t("failedToSaveSettings", "Failed to save settings"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      toast({
        title: t("error", "Error"),
        description: t("passwordsDoNotMatch", "Passwords do not match"),
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      });

      if (response.ok) {
        toast({
          title: t("passwordChanged", "Password Changed"),
          description: t(
            "passwordUpdatedSuccessfully",
            "Your password has been updated successfully"
          ),
        });
        setPasswordForm({ current: "", new: "", confirm: "" });
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      toast({
        title: t("error", "Error"),
        description: t("failedToChangePassword", "Failed to change password"),
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
      const response = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => (prev ? { ...prev, avatar: data.avatarUrl } : null));
        setAvatarFile(null);
        toast({
          title: t("avatarUpdated", "Avatar Updated"),
          description: t(
            "profilePictureUpdated",
            "Your profile picture has been updated"
          ),
        });
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast({
        title: t("error", "Error"),
        description: t("failedToUploadAvatar", "Failed to upload avatar"),
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/account/export-data", {
        method: "POST",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "my-data-export.json";
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: t("dataExported", "Data Exported"),
          description: t(
            "dataExportStarted",
            "Your data export has started downloading"
          ),
        });
      }
    } catch (error) {
      console.error("Failed to export data:", error);
      toast({
        title: t("error", "Error"),
        description: t("failedToExportData", "Failed to export data"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: t("accountDeleted", "Account Deleted"),
          description: t(
            "accountDeletedSuccessfully",
            "Your account has been deleted successfully"
          ),
        });
        // Redirect to home page or logout
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast({
        title: t("error", "Error"),
        description: t("failedToDeleteAccount", "Failed to delete account"),
        variant: "destructive",
      });
    }
  };

  // Profile Settings Tab
  const ProfileSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("personalInformation", "Personal Information")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar} alt={profile?.firstName} />
              <AvatarFallback>
                {profile?.firstName?.[0]}
                {profile?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <Label htmlFor="avatar">
                {t("profilePicture", "Profile Picture")}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                  className="file:mr-2 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
                />
                <Button
                  onClick={handleAvatarUpload}
                  disabled={!avatarFile}
                  size="sm"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {t("upload", "Upload")}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">{t("firstName", "First Name")}</Label>
              <Input
                id="firstName"
                value={profile?.firstName || ""}
                onChange={e => {
                  setProfile(prev =>
                    prev ? { ...prev, firstName: e.target.value } : null
                  );
                  setUnsavedChanges(true);
                }}
              />
            </div>

            <div>
              <Label htmlFor="lastName">{t("lastName", "Last Name")}</Label>
              <Input
                id="lastName"
                value={profile?.lastName || ""}
                onChange={e => {
                  setProfile(prev =>
                    prev ? { ...prev, lastName: e.target.value } : null
                  );
                  setUnsavedChanges(true);
                }}
              />
            </div>

            <div>
              <Label htmlFor="email">{t("email", "Email")}</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  onChange={e => {
                    setProfile(prev =>
                      prev ? { ...prev, email: e.target.value } : null
                    );
                    setUnsavedChanges(true);
                  }}
                />
                {profile?.emailVerified ? (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    {t("verified", "Verified")}
                  </Badge>
                ) : (
                  <Badge
                    variant="destructive"
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    {t("unverified", "Unverified")}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="phone">{t("phoneNumber", "Phone Number")}</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={profile?.phoneNumber || ""}
                  onChange={e => {
                    setProfile(prev =>
                      prev ? { ...prev, phoneNumber: e.target.value } : null
                    );
                    setUnsavedChanges(true);
                  }}
                />
                {profile?.phoneVerified ? (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    {t("verified", "Verified")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {t("verify", "Verify")}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="dateOfBirth">
                {t("dateOfBirth", "Date of Birth")}
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={profile?.dateOfBirth || ""}
                onChange={e => {
                  setProfile(prev =>
                    prev ? { ...prev, dateOfBirth: e.target.value } : null
                  );
                  setUnsavedChanges(true);
                }}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">{t("bio", "Bio")}</Label>
            <Textarea
              id="bio"
              value={profile?.bio || ""}
              onChange={e => {
                setProfile(prev =>
                  prev ? { ...prev, bio: e.target.value } : null
                );
                setUnsavedChanges(true);
              }}
              placeholder={t(
                "tellUsAboutYourself",
                "Tell us about yourself..."
              )}
              rows={3}
            />
          </div>

          <Button
            onClick={() => saveSettings("profile", profile)}
            disabled={!unsavedChanges || isSaving}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {t("saveChanges", "Save Changes")}
          </Button>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t("changePassword", "Change Password")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">
              {t("currentPassword", "Current Password")}
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordForm.current}
              onChange={e =>
                setPasswordForm(prev => ({ ...prev, current: e.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="newPassword">
              {t("newPassword", "New Password")}
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordForm.new}
              onChange={e =>
                setPasswordForm(prev => ({ ...prev, new: e.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">
              {t("confirmPassword", "Confirm Password")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordForm.confirm}
              onChange={e =>
                setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))
              }
            />
          </div>

          <Button
            onClick={handlePasswordChange}
            disabled={
              !passwordForm.current ||
              !passwordForm.new ||
              !passwordForm.confirm
            }
          >
            <Key className="h-4 w-4 mr-2" />
            {t("updatePassword", "Update Password")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Notification Settings Tab
  const NotificationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("emailNotifications", "Email Notifications")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications &&
            Object.entries(notifications.email).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t(key, key.replace(/([A-Z])/g, " $1").toLowerCase())}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      `${key}Description`,
                      `Receive ${key.replace(/([A-Z])/g, " $1").toLowerCase()} via email`
                    )}
                  </p>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={checked => {
                    setNotifications(prev =>
                      prev
                        ? {
                            ...prev,
                            email: { ...prev.email, [key]: checked },
                          }
                        : null
                    );
                    setUnsavedChanges(true);
                  }}
                />
              </div>
            ))}

          <Button
            onClick={() => saveSettings("notifications", notifications)}
            disabled={!unsavedChanges || isSaving}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {t("saveChanges", "Save Changes")}
          </Button>
        </CardContent>
      </Card>

      {/* Push and SMS notifications can be added similarly */}
    </div>
  );

  // Privacy Settings Tab
  const PrivacySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("privacyControls", "Privacy Controls")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t("profileVisibility", "Profile Visibility")}</Label>
            <Select
              value={privacy?.profileVisibility || "private"}
              onValueChange={(value: any) => {
                setPrivacy(prev =>
                  prev ? { ...prev, profileVisibility: value } : null
                );
                setUnsavedChanges(true);
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">{t("public", "Public")}</SelectItem>
                <SelectItem value="friends">
                  {t("friendsOnly", "Friends Only")}
                </SelectItem>
                <SelectItem value="private">
                  {t("private", "Private")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {privacy &&
            Object.entries(privacy).map(([key, value]) => {
              if (typeof value === "boolean") {
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {t(key, key.replace(/([A-Z])/g, " $1").toLowerCase())}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          `${key}Description`,
                          `Allow ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`
                        )}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={checked => {
                        setPrivacy(prev =>
                          prev ? { ...prev, [key]: checked } : null
                        );
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>
                );
              }
              return null;
            })}

          <Button
            onClick={() => saveSettings("privacy", privacy)}
            disabled={!unsavedChanges || isSaving}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {t("saveChanges", "Save Changes")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Appearance Settings Tab
  const AppearanceSettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t("appearanceSettings", "Appearance Settings")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t("theme", "Theme")}</Label>
            <Select
              value={appearance?.theme || "system"}
              onValueChange={(value: any) => {
                setAppearance(prev =>
                  prev ? { ...prev, theme: value } : null
                );
                setUnsavedChanges(true);
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    {t("light", "Light")}
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    {t("dark", "Dark")}
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    {t("system", "System")}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("language", "Language")}</Label>
            <Select
              value={appearance?.language || "en"}
              onValueChange={(value: any) => {
                setAppearance(prev =>
                  prev ? { ...prev, language: value } : null
                );
                setUnsavedChanges(true);
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="ro">Română</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t("currency", "Currency")}</Label>
            <Select
              value={appearance?.currency || "USD"}
              onValueChange={(value: any) => {
                setAppearance(prev =>
                  prev ? { ...prev, currency: value } : null
                );
                setUnsavedChanges(true);
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="RON">RON (lei)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Accessibility Options */}
          {appearance && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t("reducedMotion", "Reduced Motion")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "reducedMotionDescription",
                      "Reduce animations and transitions"
                    )}
                  </p>
                </div>
                <Switch
                  checked={appearance.reducedMotion}
                  onCheckedChange={checked => {
                    setAppearance(prev =>
                      prev ? { ...prev, reducedMotion: checked } : null
                    );
                    setUnsavedChanges(true);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t("highContrast", "High Contrast")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "highContrastDescription",
                      "Increase contrast for better visibility"
                    )}
                  </p>
                </div>
                <Switch
                  checked={appearance.highContrast}
                  onCheckedChange={checked => {
                    setAppearance(prev =>
                      prev ? { ...prev, highContrast: checked } : null
                    );
                    setUnsavedChanges(true);
                  }}
                />
              </div>
            </>
          )}

          <Button
            onClick={() => saveSettings("appearance", appearance)}
            disabled={!unsavedChanges || isSaving}
            className="w-full md:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {t("saveChanges", "Save Changes")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Data Management Tab
  const DataManagement = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t("dataManagement", "Data Management")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">
                {t("exportData", "Export Your Data")}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t(
                  "exportDataDescription",
                  "Download a copy of all your data including orders, wishlist, and preferences"
                )}
              </p>
              <Button onClick={handleExportData} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {t("exportData", "Export Data")}
              </Button>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2 text-red-600">
                {t("dangerZone", "Danger Zone")}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t(
                  "deleteAccountDescription",
                  "Permanently delete your account and all associated data"
                )}
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("deleteAccount", "Delete Account")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      {t("confirmAccountDeletion", "Confirm Account Deletion")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(
                        "deleteAccountWarning",
                        "This action cannot be undone. This will permanently delete your account and remove all your data from our servers."
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {t("cancel", "Cancel")}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {t("deleteAccount", "Delete Account")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h1 className="text-3xl font-bold mb-2">{t("settings", "Settings")}</h1>
        <p className="text-muted-foreground">
          {t(
            "manageAccountSettings",
            "Manage your account settings and preferences"
          )}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{t("profile", "Profile")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("notifications", "Notifications")}
            </span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{t("privacy", "Privacy")}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("appearance", "Appearance")}
            </span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">{t("data", "Data")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="privacy" className="mt-6">
          <PrivacySettings />
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <AppearanceSettingsTab />
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <DataManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
