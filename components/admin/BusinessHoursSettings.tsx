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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { HelpTooltip } from "@/components/ui/tooltip";

interface BusinessHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

interface BusinessHoursSettingsProps {
  businessHours: BusinessHours;
  onSave: (businessHours: BusinessHours) => void;
  isSaving: boolean;
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

export default function BusinessHoursSettings({
  businessHours,
  onSave,
  isSaving,
}: BusinessHoursSettingsProps) {
  const [localBusinessHours, setLocalBusinessHours] =
    React.useState<BusinessHours>(businessHours);

  const updateDay = (
    day: keyof BusinessHours,
    field: "open" | "close" | "closed",
    value: string | boolean
  ) => {
    setLocalBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    onSave(localBusinessHours);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Hours</CardTitle>
        <CardDescription>
          Configure the operating hours of your store
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day, index) => (
          <div key={day.key}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor={`${day.key}-open`}>{day.label} Open</Label>
                  <HelpTooltip
                    content={
                      <div className="space-y-2">
                        <p className="font-medium">Opening Time</p>
                        <p>
                          The time your store opens on {day.label}. This affects
                          when customers can expect to receive support and when
                          orders are processed.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Example:</strong> Set to "09:00" if your store
                          opens at 9 AM. This helps customers know when they can
                          expect responses to inquiries and when order
                          processing begins.
                        </p>
                      </div>
                    }
                  />
                </div>
                <Input
                  id={`${day.key}-open`}
                  value={localBusinessHours[day.key].open}
                  onChange={e => updateDay(day.key, "open", e.target.value)}
                  type="time"
                  disabled={localBusinessHours[day.key].closed}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor={`${day.key}-close`}>{day.label} Close</Label>
                  <HelpTooltip
                    content={
                      <div className="space-y-2">
                        <p className="font-medium">Closing Time</p>
                        <p>
                          The time your store closes on {day.label}. Orders
                          placed after this time will be processed the next
                          business day.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Example:</strong> Set to "18:00" if your store
                          closes at 6 PM. Orders placed after 6 PM will be
                          processed the next business day, affecting delivery
                          estimates.
                        </p>
                      </div>
                    }
                  />
                </div>
                <Input
                  id={`${day.key}-close`}
                  value={localBusinessHours[day.key].close}
                  onChange={e => updateDay(day.key, "close", e.target.value)}
                  type="time"
                  disabled={localBusinessHours[day.key].closed}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor={`${day.key}-closed`}>
                    {day.label} Closed
                  </Label>
                  <HelpTooltip
                    content={
                      <div className="space-y-2">
                        <p className="font-medium">Store Closed</p>
                        <p>
                          Toggle this on if your store is closed on {day.label}.
                          When enabled, the open/close times are ignored and the
                          store is considered closed all day.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Example:</strong> Enable this for Sunday if
                          your store is closed on Sundays. Orders placed on
                          Sunday will be processed on Monday, and customers
                          won't expect support responses.
                        </p>
                      </div>
                    }
                  />
                </div>
                <Switch
                  checked={localBusinessHours[day.key].closed}
                  onCheckedChange={checked =>
                    updateDay(day.key, "closed", checked)
                  }
                  id={`${day.key}-closed`}
                />
              </div>
            </div>
            {index < DAYS.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
}
