"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  Shield,
  Bell,
  Save,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Upload,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";

interface SupplierProfile {
  id: string;
  companyName: string;
  email: string;
  phone?: string;
  businessAddress?: string;
  businessCity?: string;
  businessCountry?: string;
  businessWebsite?: string;
  taxId?: string;
  registrationNumber?: string;
  contactPersonName?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  commissionRate: number;
  status: string;
  createdAt: string;
  logoUrl?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  orderNotifications: boolean;
  paymentNotifications: boolean;
  marketingEmails: boolean;
  smsNotifications: boolean;
}

interface SettingsData {
  profile: SupplierProfile;
  notifications: NotificationSettings;
}

export function SupplierSettings({
  initialData,
}: {
  initialData?: SettingsData | null;
}) {
  const { data: session } = useSession();
  const [settingsData, setSettingsData] = useState<SettingsData | null>(
    initialData ?? null
  );
  const [loading, setLoading] = useState(!initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState<Partial<SupplierProfile>>({});
  const [notificationForm, setNotificationForm] =
    useState<NotificationSettings>({
      emailNotifications: true,
      orderNotifications: true,
      paymentNotifications: true,
      marketingEmails: false,
      smsNotifications: false,
    });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (initialData) {
      setSettingsData(initialData);
      setProfileForm(initialData.profile);
      setNotificationForm(initialData.notifications);
    } else {
      fetchSettingsData();
    }
  }, [initialData]);

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/supplier/settings", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Failed to load settings data");
      }
      const data = await res.json();
      setSettingsData(data);
      setProfileForm(data.profile);
      setNotificationForm(data.notifications);
    } catch (err) {
      console.error("Error fetching settings data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/supplier/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      await fetchSettingsData();
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/supplier/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationForm),
      });

      if (!res.ok) {
        throw new Error("Failed to update notification settings");
      }

      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved.",
      });

      await fetchSettingsData();
    } catch (err) {
      console.error("Error updating notifications:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update notifications"
      );
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/supplier/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }

      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Error changing password:", err);
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/supplier/settings/logo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload logo");
      }

      const data = await res.json();
      setProfileForm({ ...profileForm, logoUrl: data.logoUrl });

      toast({
        title: "Logo Updated",
        description: "Your company logo has been successfully updated.",
      });
    } catch (err) {
      console.error("Error uploading logo:", err);
      setError(err instanceof Error ? err.message : "Failed to upload logo");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your business information, notifications, and security
            settings
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your contact information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {profileForm.logoUrl ? (
                      <img
                        src={profileForm.logoUrl}
                        alt="Company logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadLogo(file);
                      }}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Company Logo</h3>
                  <p className="text-sm text-gray-600">
                    Upload a logo for your business (max 2MB)
                  </p>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Person Name</Label>
                  <Input
                    id="contactName"
                    value={profileForm.contactPersonName || ""}
                    onChange={e =>
                      setProfileForm({
                        ...profileForm,
                        contactPersonName: e.target.value,
                      })
                    }
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={profileForm.contactPersonEmail || ""}
                    onChange={e =>
                      setProfileForm({
                        ...profileForm,
                        contactPersonEmail: e.target.value,
                      })
                    }
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={profileForm.contactPersonPhone || ""}
                    onChange={e =>
                      setProfileForm({
                        ...profileForm,
                        contactPersonPhone: e.target.value,
                      })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Business Phone</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone || ""}
                    onChange={e =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <Separator />

              {/* Business Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Business Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={profileForm.businessAddress || ""}
                      onChange={e =>
                        setProfileForm({
                          ...profileForm,
                          businessAddress: e.target.value,
                        })
                      }
                      placeholder="123 Business St"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profileForm.businessCity || ""}
                      onChange={e =>
                        setProfileForm({
                          ...profileForm,
                          businessCity: e.target.value,
                        })
                      }
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={profileForm.businessCountry || ""}
                      onValueChange={value =>
                        setProfileForm({
                          ...profileForm,
                          businessCountry: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="US">United States</SelectItem>
                        <SelectItem value="CA">Canada</SelectItem>
                        <SelectItem value="GB">United Kingdom</SelectItem>
                        <SelectItem value="DE">Germany</SelectItem>
                        <SelectItem value="FR">France</SelectItem>
                        <SelectItem value="RO">Romania</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profileForm.businessWebsite || ""}
                      onChange={e =>
                        setProfileForm({
                          ...profileForm,
                          businessWebsite: e.target.value,
                        })
                      }
                      placeholder="https://www.company.com"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about important updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <Label className="text-base">Email Notifications</Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Receive important updates via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationForm.emailNotifications}
                    onCheckedChange={checked =>
                      setNotificationForm({
                        ...notificationForm,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <Label className="text-base">Order Notifications</Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Get notified when orders are placed or updated
                    </p>
                  </div>
                  <Switch
                    checked={notificationForm.orderNotifications}
                    onCheckedChange={checked =>
                      setNotificationForm({
                        ...notificationForm,
                        orderNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <Label className="text-base">Payment Notifications</Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Receive payment and invoice updates
                    </p>
                  </div>
                  <Switch
                    checked={notificationForm.paymentNotifications}
                    onCheckedChange={checked =>
                      setNotificationForm({
                        ...notificationForm,
                        paymentNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-600" />
                      <Label className="text-base">Marketing Emails</Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Receive promotional content and updates
                    </p>
                  </div>
                  <Switch
                    checked={notificationForm.marketingEmails}
                    onCheckedChange={checked =>
                      setNotificationForm({
                        ...notificationForm,
                        marketingEmails: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-indigo-600" />
                      <Label className="text-base">SMS Notifications</Label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Get urgent notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={notificationForm.smsNotifications}
                    onCheckedChange={checked =>
                      setNotificationForm({
                        ...notificationForm,
                        smsNotifications: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveNotifications} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={e =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        current: !showPasswords.current,
                      })
                    }
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={e =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        new: !showPasswords.new,
                      })
                    }
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={e =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        confirm: !showPasswords.confirm,
                      })
                    }
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={changePassword} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Changing...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Legal and business details for compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={profileForm.companyName || ""}
                    onChange={e =>
                      setProfileForm({
                        ...profileForm,
                        companyName: e.target.value,
                      })
                    }
                    placeholder="Your Company Ltd."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email || ""}
                    onChange={e =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    placeholder="business@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                  <Input
                    id="taxId"
                    value={profileForm.taxId || ""}
                    onChange={e =>
                      setProfileForm({ ...profileForm, taxId: e.target.value })
                    }
                    placeholder="RO12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">
                    Registration Number
                  </Label>
                  <Input
                    id="registrationNumber"
                    value={profileForm.registrationNumber || ""}
                    onChange={e =>
                      setProfileForm({
                        ...profileForm,
                        registrationNumber: e.target.value,
                      })
                    }
                    placeholder="J12/3456/2020"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Commission Rate</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {profileForm.commissionRate || 0}%
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Commission earned on each sale
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account Status</Label>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      profileForm.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : profileForm.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }
                  >
                    {profileForm.status}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {profileForm.status === "APPROVED"
                      ? "Your account is active and you can receive orders"
                      : profileForm.status === "PENDING"
                        ? "Your application is being reviewed"
                        : "Your account status"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Business Info
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
