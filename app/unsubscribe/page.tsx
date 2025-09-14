"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";

interface UnsubscribeData {
  success: boolean;
  email?: string;
  token?: string;
  message?: string;
  error?: string;
}

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<UnsubscribeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [preferences, setPreferences] = useState({
    marketing: true,
    newsletter: true,
    transactional: false, // Keep transactional emails by default
  });
  const [reason, setReason] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setData({ success: false, error: "No unsubscribe token provided" });
      setLoading(false);
      return;
    }

    // Validate token
    fetch(`/api/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        if (data.success) {
          // Pre-populate preferences based on current consents
          // This would be enhanced with actual consent data
        }
      })
      .catch(error => {
        console.error("Error validating token:", error);
        setData({
          success: false,
          error: "Failed to validate unsubscribe link",
        });
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.token) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: data.token,
          reason,
          preferences,
        }),
      });

      const result = await response.json();
      setResult(result);
    } catch (error) {
      console.error("Error submitting unsubscribe:", error);
      setResult({
        success: false,
        message: "Failed to process unsubscribe request. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Validating unsubscribe link...</p>
        </div>
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Link</CardTitle>
            <CardDescription>
              {data?.error ||
                "This unsubscribe link is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/">Return to Homepage</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">
              Successfully Unsubscribed
            </CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                You will no longer receive marketing emails from TechTots STEM
                Store. You may still receive important transactional emails
                about your orders.
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <a href="/">Return to Homepage</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Unsubscribe from Emails
          </CardTitle>
          <CardDescription>
            Manage your email preferences for {data.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Email Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="marketing"
                    checked={preferences.marketing}
                    onCheckedChange={checked =>
                      setPreferences(prev => ({
                        ...prev,
                        marketing: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="marketing" className="text-sm">
                    Marketing emails (promotions, offers, new products)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={preferences.newsletter}
                    onCheckedChange={checked =>
                      setPreferences(prev => ({
                        ...prev,
                        newsletter: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="newsletter" className="text-sm">
                    Newsletter (STEM tips, educational content)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transactional"
                    checked={preferences.transactional}
                    onCheckedChange={checked =>
                      setPreferences(prev => ({
                        ...prev,
                        transactional: !!checked,
                      }))
                    }
                    disabled
                  />
                  <Label
                    htmlFor="transactional"
                    className="text-sm text-gray-500"
                  >
                    Transactional emails (order confirmations, shipping updates)
                    - Required
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for unsubscribing (optional)
              </Label>
              <Textarea
                id="reason"
                placeholder="Help us improve by sharing why you're unsubscribing..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {result && !result.success && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Update Preferences"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <a href="/">Cancel</a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
