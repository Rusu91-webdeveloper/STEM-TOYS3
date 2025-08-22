"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface CustomerService {
  supportEmail: string;
  supportPhone: string;
  liveChatEnabled: boolean;
  liveChatHours: string;
}

interface CustomerServiceSettingsProps {
  customerService: CustomerService;
  onSave: (customerService: CustomerService) => void;
  isSaving: boolean;
}

export default function CustomerServiceSettings({
  customerService,
  onSave,
  isSaving,
}: CustomerServiceSettingsProps) {
  const [localCustomerService, setLocalCustomerService] =
    React.useState<CustomerService>(customerService);

  const updateField = (
    field: keyof CustomerService,
    value: string | boolean
  ) => {
    setLocalCustomerService(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onSave(localCustomerService);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Service</CardTitle>
        <CardDescription>
          Configure customer support and live chat settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="support-email">Support Email</Label>
            <Input
              id="support-email"
              value={localCustomerService.supportEmail}
              onChange={e => updateField("supportEmail", e.target.value)}
              type="email"
              placeholder="support@techtots.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-phone">Support Phone</Label>
            <Input
              id="support-phone"
              value={localCustomerService.supportPhone}
              onChange={e => updateField("supportPhone", e.target.value)}
              type="tel"
              placeholder="+1 (555) 234-5678"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="live-chat-enabled">Enable Live Chat</Label>
            <Switch
              checked={localCustomerService.liveChatEnabled}
              onCheckedChange={checked =>
                updateField("liveChatEnabled", checked)
              }
              id="live-chat-enabled"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="live-chat-hours">Live Chat Hours</Label>
            <Input
              id="live-chat-hours"
              value={localCustomerService.liveChatHours}
              onChange={e => updateField("liveChatHours", e.target.value)}
              type="text"
              placeholder="24/7 or 9 AM - 6 PM EST"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
