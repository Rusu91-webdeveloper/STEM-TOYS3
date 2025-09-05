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
import { HelpTooltip } from "@/components/ui/tooltip";

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
            <div className="flex items-center gap-1">
              <Label htmlFor="support-email">Support Email</Label>
              <HelpTooltip
                content={
                  <div className="space-y-2">
                    <p className="font-medium">Support Email</p>
                    <p>
                      The email address customers can use to contact your
                      support team. This appears on your website and in customer
                      communications.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Example:</strong> "support@techtots.com" -
                      Customers will use this email for technical support, order
                      inquiries, and general questions.
                    </p>
                  </div>
                }
              />
            </div>
            <Input
              id="support-email"
              value={localCustomerService.supportEmail}
              onChange={e => updateField("supportEmail", e.target.value)}
              type="email"
              placeholder="support@techtots.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="support-phone">Support Phone</Label>
              <HelpTooltip
                content={
                  <div className="space-y-2">
                    <p className="font-medium">Support Phone</p>
                    <p>
                      The phone number customers can call for immediate support.
                      This is especially important for urgent issues or complex
                      inquiries.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Example:</strong> "+1 (555) 234-5678" - Customers
                      can call this number for urgent support, order issues, or
                      when they prefer speaking to someone directly.
                    </p>
                  </div>
                }
              />
            </div>
            <Input
              id="support-phone"
              value={localCustomerService.supportPhone}
              onChange={e => updateField("supportPhone", e.target.value)}
              type="tel"
              placeholder="+1 (555) 234-5678"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="live-chat-enabled">Enable Live Chat</Label>
              <HelpTooltip
                content={
                  <div className="space-y-2">
                    <p className="font-medium">Live Chat Feature</p>
                    <p>
                      When enabled, customers can chat with your support team in
                      real-time while browsing your store. This provides instant
                      help and can increase conversions.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Example:</strong> When enabled, a chat widget
                      appears on your website allowing customers to ask
                      questions about products, shipping, or get help with their
                      orders instantly.
                    </p>
                  </div>
                }
              />
            </div>
            <Switch
              checked={localCustomerService.liveChatEnabled}
              onCheckedChange={checked =>
                updateField("liveChatEnabled", checked)
              }
              id="live-chat-enabled"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="live-chat-hours">Live Chat Hours</Label>
              <HelpTooltip
                content={
                  <div className="space-y-2">
                    <p className="font-medium">Live Chat Availability</p>
                    <p>
                      The hours when your live chat support is available. This
                      helps customers know when they can expect immediate
                      responses to their chat messages.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Example:</strong> "9 AM - 6 PM EST" - Customers
                      will see this information and know that live chat is
                      available during these hours. Outside these hours, they
                      can still leave messages for later response.
                    </p>
                  </div>
                }
              />
            </div>
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
