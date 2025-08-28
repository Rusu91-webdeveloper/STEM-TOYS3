"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  Bell,
  Save,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface SupplierData {
  id: string;
  companyName: string;
  companySlug: string;
  description: string;
  website: string;
  phone: string;
  vatNumber: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessCountry: string;
  businessPostalCode: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  yearEstablished: number;
  employeeCount: number;
  annualRevenue: string;
  certifications: string[];
  productCategories: string[];
  commissionRate: number;
  paymentTerms: number;
  minimumOrderValue: number;
  logo: string | null;
  catalogUrl: string | null;
}

export function SupplierSettings() {
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SupplierData>>({});

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/supplier/auth/me");
      if (!response.ok) throw new Error("Failed to fetch supplier data");

      const data = await response.json();
      setSupplier(data);
      setFormData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/supplier/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      setSuccess("Settings saved successfully!");
      await fetchSupplierData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SupplierData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Failed to load supplier data</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your supplier account settings and preferences.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName || ""}
                onChange={e => handleInputChange("companyName", e.target.value)}
                placeholder="Your company name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={e => handleInputChange("description", e.target.value)}
                placeholder="Brief description of your company"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website || ""}
                onChange={e => handleInputChange("website", e.target.value)}
                placeholder="https://your-website.com"
              />
            </div>
            <div>
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input
                id="vatNumber"
                value={formData.vatNumber || ""}
                onChange={e => handleInputChange("vatNumber", e.target.value)}
                placeholder="VAT123456789"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="contactPersonName">Contact Person</Label>
              <Input
                id="contactPersonName"
                value={formData.contactPersonName || ""}
                onChange={e =>
                  handleInputChange("contactPersonName", e.target.value)
                }
                placeholder="Full name"
              />
            </div>
            <div>
              <Label htmlFor="contactPersonEmail">Email</Label>
              <Input
                id="contactPersonEmail"
                type="email"
                value={formData.contactPersonEmail || ""}
                onChange={e =>
                  handleInputChange("contactPersonEmail", e.target.value)
                }
                placeholder="contact@company.com"
              />
            </div>
            <div>
              <Label htmlFor="contactPersonPhone">Phone</Label>
              <Input
                id="contactPersonPhone"
                value={formData.contactPersonPhone || ""}
                onChange={e =>
                  handleInputChange("contactPersonPhone", e.target.value)
                }
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label htmlFor="phone">Company Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={e => handleInputChange("phone", e.target.value)}
                placeholder="+1234567890"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Business Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessAddress">Address</Label>
              <Input
                id="businessAddress"
                value={formData.businessAddress || ""}
                onChange={e =>
                  handleInputChange("businessAddress", e.target.value)
                }
                placeholder="123 Business Street"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessCity">City</Label>
                <Input
                  id="businessCity"
                  value={formData.businessCity || ""}
                  onChange={e =>
                    handleInputChange("businessCity", e.target.value)
                  }
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="businessState">State</Label>
                <Input
                  id="businessState"
                  value={formData.businessState || ""}
                  onChange={e =>
                    handleInputChange("businessState", e.target.value)
                  }
                  placeholder="State"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="businessCountry">Country</Label>
                <Input
                  id="businessCountry"
                  value={formData.businessCountry || ""}
                  onChange={e =>
                    handleInputChange("businessCountry", e.target.value)
                  }
                  placeholder="Country"
                />
              </div>
              <div>
                <Label htmlFor="businessPostalCode">Postal Code</Label>
                <Input
                  id="businessPostalCode"
                  value={formData.businessPostalCode || ""}
                  onChange={e =>
                    handleInputChange("businessPostalCode", e.target.value)
                  }
                  placeholder="12345"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="yearEstablished">Year Established</Label>
              <Input
                id="yearEstablished"
                type="number"
                value={formData.yearEstablished || ""}
                onChange={e =>
                  handleInputChange(
                    "yearEstablished",
                    parseInt(e.target.value) || null
                  )
                }
                placeholder="2020"
              />
            </div>
            <div>
              <Label htmlFor="employeeCount">Number of Employees</Label>
              <Input
                id="employeeCount"
                type="number"
                value={formData.employeeCount || ""}
                onChange={e =>
                  handleInputChange(
                    "employeeCount",
                    parseInt(e.target.value) || null
                  )
                }
                placeholder="25"
              />
            </div>
            <div>
              <Label htmlFor="annualRevenue">Annual Revenue Range</Label>
              <Select
                value={formData.annualRevenue || ""}
                onValueChange={value =>
                  handleInputChange("annualRevenue", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select revenue range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-50000">$0 - $50,000</SelectItem>
                  <SelectItem value="50000-100000">
                    $50,000 - $100,000
                  </SelectItem>
                  <SelectItem value="100000-500000">
                    $100,000 - $500,000
                  </SelectItem>
                  <SelectItem value="500000-1000000">
                    $500,000 - $1,000,000
                  </SelectItem>
                  <SelectItem value="1000000+">$1,000,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Financial Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                step="0.1"
                value={formData.commissionRate || ""}
                onChange={e =>
                  handleInputChange(
                    "commissionRate",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="15.0"
              />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
              <Input
                id="paymentTerms"
                type="number"
                value={formData.paymentTerms || ""}
                onChange={e =>
                  handleInputChange(
                    "paymentTerms",
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="30"
              />
            </div>
            <div>
              <Label htmlFor="minimumOrderValue">Minimum Order Value (€)</Label>
              <Input
                id="minimumOrderValue"
                type="number"
                step="0.01"
                value={formData.minimumOrderValue || ""}
                onChange={e =>
                  handleInputChange(
                    "minimumOrderValue",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="100.00"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600">
                  Receive notifications about orders and payments
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Order Updates</Label>
                <p className="text-sm text-gray-600">
                  Get notified when order status changes
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Payment Reminders</Label>
                <p className="text-sm text-gray-600">
                  Receive payment due reminders
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
