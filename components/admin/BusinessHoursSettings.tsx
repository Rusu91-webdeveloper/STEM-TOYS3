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
                <Label htmlFor={`${day.key}-open`}>{day.label} Open</Label>
                <Input
                  id={`${day.key}-open`}
                  value={localBusinessHours[day.key].open}
                  onChange={e => updateDay(day.key, "open", e.target.value)}
                  type="time"
                  disabled={localBusinessHours[day.key].closed}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${day.key}-close`}>{day.label} Close</Label>
                <Input
                  id={`${day.key}-close`}
                  value={localBusinessHours[day.key].close}
                  onChange={e => updateDay(day.key, "close", e.target.value)}
                  type="time"
                  disabled={localBusinessHours[day.key].closed}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${day.key}-closed`}>{day.label} Closed</Label>
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
