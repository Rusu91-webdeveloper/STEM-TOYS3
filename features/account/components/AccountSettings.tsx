"use client";

import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n";

import { AccountPrivacyPanel } from "./AccountPrivacyPanel";

export function AccountSettings() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language || "ro");
  const [currency, setCurrency] = useState("RON");

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    // Update language cookie and refresh page to apply changes
    setCookie("NEXT_LOCALE", value);
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Apply language change if different from current
      if (selectedLanguage !== language) {
        setCookie("NEXT_LOCALE", selectedLanguage);
        // Refresh the page to apply the language change
        router.refresh();
      }

      toast({
        title: t("preferencesUpdated", "Preferințe actualizate"),
        description: t(
          "accountPreferencesSaved",
          "Preferințele contului tău au fost salvate."
        ),
      });
    } catch {
      toast({
        title: "Eroare",
        description: t(
          "failedToUpdatePreferences",
          "Nu s-au putut actualiza preferințele. Te rugăm să încerci din nou."
        ),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/50 border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle>
            {language === "en"
              ? "Email notifications"
              : "Notificări prin email"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            {language === "en"
              ? "Order and account messages are sent when needed to provide the service. For marketing emails, use the unsubscribe link in the email or contact info@techtots.ro. Analytics and advertising consent can be changed with Cookie settings."
              : "Mesajele despre comenzi și cont sunt trimise când sunt necesare serviciului. Pentru emailurile de marketing, folosește linkul de dezabonare din mesaj sau contactează info@techtots.ro. Consimțământul pentru analiză și publicitate poate fi schimbat din Setări cookie-uri."}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/50 backdrop-blur-sm border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">
            {t("accountPreferences", "Preferințe Cont")}
          </CardTitle>
          <CardDescription>
            {t(
              "manageAccountSettings",
              "Gestionează setările și preferințele contului tău"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-gray-800 font-medium">
                {t("language", "Limbă")}
              </Label>
              <Select
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger className="bg-white/70 transition-all focus:ring-primary/30">
                  <SelectValue
                    placeholder={t("selectLanguage", "Selectează limba")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ro">Română</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-gray-800 font-medium">
                {t("currency", "Monedă")}
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-white/70 transition-all focus:ring-primary/30">
                  <SelectValue
                    placeholder={t("selectCurrency", "Selectează moneda")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RON">RON (Lei)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="pt-4">
            <Button
              onClick={handleSavePreferences}
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300 shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {t("saving", "Se salvează...")}
                </>
              ) : (
                t("savePreferences", "Salvează preferințele")
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AccountPrivacyPanel />
    </div>
  );
}
