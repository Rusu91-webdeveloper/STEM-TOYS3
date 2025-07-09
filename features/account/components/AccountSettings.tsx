"use client";

import { setCookie } from "cookies-next";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/lib/i18n";

export function AccountSettings() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState({
    marketing: true,
    orderUpdates: true,
    newProducts: false,
    accountActivity: true,
  });
  const [selectedLanguage, setSelectedLanguage] = useState(language || "ro");
  const [currency, setCurrency] = useState("RON");

  const handleToggleNotification = (key: keyof typeof emailNotifications) => {
    setEmailNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: t("settingsUpdated", "Setări actualizate"),
        description: t(
          "notificationPreferencesSaved",
          "Preferințele tale de notificare au fost salvate."
        ),
      });
    } catch (error) {
      toast({
        title: t("error", "Eroare"),
        description: t(
          "failedToUpdateSettings",
          "Nu s-au putut actualiza setările. Te rugăm să încerci din nou."
        ),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    // Update language cookie and refresh page to apply changes
    setCookie("NEXT_LOCALE", value);
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
    } catch (error) {
      toast({
        title: t("error", "Eroare"),
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

  const handleDeleteAccount = async () => {
    // In a real app, this would show a confirmation dialog
    toast({
      title: t("accountDeletionRequested", "Ștergere cont solicitată"),
      description: t(
        "contactSupportToComplete",
        "Te rugăm să contactezi asistența pentru a finaliza ștergerea contului."
      ),
      variant: "destructive",
    });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/50 backdrop-blur-sm border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">
            {t("emailNotifications", "Notificări prin Email")}
          </CardTitle>
          <CardDescription>
            {t("chooseUpdates", "Alege ce actualizări dorești să primești")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 hover:bg-white/70 rounded-lg transition-all">
            <div className="space-y-0.5">
              <Label
                htmlFor="marketing"
                className="text-gray-800 font-medium">
                {t("marketingEmails", "Email-uri de marketing")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t(
                  "receiveMarketingEmails",
                  "Primește email-uri despre produse noi, funcții și altele."
                )}
              </p>
            </div>
            <Switch
              id="marketing"
              checked={emailNotifications.marketing}
              onCheckedChange={() => handleToggleNotification("marketing")}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div className="flex justify-between items-center p-3 hover:bg-white/70 rounded-lg transition-all">
            <div className="space-y-0.5">
              <Label
                htmlFor="orderUpdates"
                className="text-gray-800 font-medium">
                {t("orderUpdates", "Actualizări comandă")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t(
                  "receiveOrderEmails",
                  "Primește email-uri despre starea comenzii, expediere și livrare."
                )}
              </p>
            </div>
            <Switch
              id="orderUpdates"
              checked={emailNotifications.orderUpdates}
              onCheckedChange={() => handleToggleNotification("orderUpdates")}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div className="flex justify-between items-center p-3 hover:bg-white/70 rounded-lg transition-all">
            <div className="space-y-0.5">
              <Label
                htmlFor="newProducts"
                className="text-gray-800 font-medium">
                {t("newProducts", "Produse noi")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t(
                  "receiveNewProductNotifications",
                  "Primește notificări când sunt disponibile produse noi."
                )}
              </p>
            </div>
            <Switch
              id="newProducts"
              checked={emailNotifications.newProducts}
              onCheckedChange={() => handleToggleNotification("newProducts")}
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div className="flex justify-between items-center p-3 hover:bg-white/70 rounded-lg transition-all">
            <div className="space-y-0.5">
              <Label
                htmlFor="accountActivity"
                className="text-gray-800 font-medium">
                {t("accountActivity", "Activitate cont")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t(
                  "receiveAccountNotifications",
                  "Primește notificări importante despre activitatea contului tău."
                )}
              </p>
            </div>
            <Switch
              id="accountActivity"
              checked={emailNotifications.accountActivity}
              onCheckedChange={() =>
                handleToggleNotification("accountActivity")
              }
              className="data-[state=checked]:bg-primary"
            />
          </div>
          <div className="pt-4">
            <Button
              onClick={handleSaveNotifications}
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300 shadow-sm hover:shadow-md">
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {t("saving", "Se salvează...")}
                </>
              ) : (
                t(
                  "saveNotificationPreferences",
                  "Salvează preferințele de notificare"
                )
              )}
            </Button>
          </div>
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
              <Label
                htmlFor="language"
                className="text-gray-800 font-medium">
                {t("language", "Limbă")}
              </Label>
              <Select
                value={selectedLanguage}
                onValueChange={handleLanguageChange}>
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
              <Label
                htmlFor="currency"
                className="text-gray-800 font-medium">
                {t("currency", "Monedă")}
              </Label>
              <Select
                value={currency}
                onValueChange={setCurrency}>
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
              className="bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary transition-all duration-300 shadow-sm hover:shadow-md">
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

      <Card className="bg-white/50 backdrop-blur-sm border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-red-600">
            {t("dangerZone", "Zonă de pericol")}
          </CardTitle>
          <CardDescription>
            {t("irreversibleActions", "Acțiuni ireversibile pentru contul tău")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-red-200 rounded-lg bg-red-50/50">
            <h4 className="font-medium text-red-800 mb-2">
              {t("deleteAccount", "Șterge contul")}
            </h4>
            <p className="text-sm text-red-700 mb-4">
              {t(
                "permanentlyDelete",
                "Această acțiune este permanentă și nu poate fi anulată. Toate datele tale vor fi șterse definitiv."
              )}
            </p>
            <Button
              onClick={handleDeleteAccount}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 transition-all shadow-sm hover:shadow-md">
              {t("deleteAccount", "Șterge contul meu")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
