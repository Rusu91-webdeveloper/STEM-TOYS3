"use client";

import {
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  MapPin,
  Heart,
  ShoppingBag,
  Bell,
  Gift,
  Lightbulb,
  Target,
  Sparkles,
  BookOpen,
  Users,
  Calendar,
  Star,
  ArrowRight,
  X,
  Play,
  Pause,
  SkipForward,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<OnboardingStepProps>;
  required?: boolean;
}

interface OnboardingStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

interface OnboardingData {
  // Personal Info
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phoneNumber?: string;

  // Preferences
  interests: string[];
  ageGroups: string[];
  learningGoals: string[];
  budgetRange: string;
  shoppingFrequency: string;

  // Notifications
  emailNotifications: {
    newsletter: boolean;
    promotions: boolean;
    orderUpdates: boolean;
    priceAlerts: boolean;
    newProducts: boolean;
  };

  // Address
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  // Initial Wishlist
  initialProducts: string[];

  // Tutorial Preferences
  skipTutorial: boolean;
  completedSteps: string[];
}

interface UserOnboardingProps {
  isOpen: boolean;
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
  initialData?: Partial<OnboardingData>;
  className?: string;
}

const INTERESTS = [
  { id: "science", label: "Science Experiments", icon: "🔬" },
  { id: "technology", label: "Technology & Coding", icon: "💻" },
  { id: "engineering", label: "Engineering & Building", icon: "🏗️" },
  { id: "mathematics", label: "Mathematics & Logic", icon: "🧮" },
  { id: "robotics", label: "Robotics", icon: "🤖" },
  { id: "electronics", label: "Electronics", icon: "⚡" },
  { id: "chemistry", label: "Chemistry", icon: "⚗️" },
  { id: "physics", label: "Physics", icon: "🔭" },
  { id: "biology", label: "Biology", icon: "🧬" },
  { id: "astronomy", label: "Astronomy", icon: "🌟" },
];

const AGE_GROUPS = [
  { id: "3-5", label: "3-5 years (Preschool)" },
  { id: "6-8", label: "6-8 years (Early Elementary)" },
  { id: "9-11", label: "9-11 years (Elementary)" },
  { id: "12-14", label: "12-14 years (Middle School)" },
  { id: "15-17", label: "15-17 years (High School)" },
  { id: "18+", label: "18+ years (Adult/College)" },
];

const LEARNING_GOALS = [
  { id: "problem_solving", label: "Problem Solving Skills" },
  { id: "creativity", label: "Creativity & Innovation" },
  { id: "critical_thinking", label: "Critical Thinking" },
  { id: "collaboration", label: "Collaboration & Teamwork" },
  { id: "communication", label: "Communication Skills" },
  { id: "technical_skills", label: "Technical Skills" },
  { id: "academic_support", label: "Academic Support" },
  { id: "career_prep", label: "Career Preparation" },
];

const BUDGET_RANGES = [
  { id: "under_25", label: "Under $25" },
  { id: "25_50", label: "$25 - $50" },
  { id: "50_100", label: "$50 - $100" },
  { id: "100_200", label: "$100 - $200" },
  { id: "over_200", label: "Over $200" },
];

// Welcome Step
const WelcomeStep: React.FC<OnboardingStepProps> = ({ onNext }) => {
  const { t } = useTranslation();

  return (
    <div className="text-center space-y-6 max-w-md mx-auto">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full animate-pulse" />
        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-purple-600" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">
          {t("welcomeToSTEMToys", "Welcome to STEM Toys!")}
        </h2>
        <p className="text-muted-foreground">
          {t(
            "onboardingWelcomeText",
            "Let's set up your account to provide you with the best educational product recommendations."
          )}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 text-left">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {t("personalizedRecommendations", "Personalized Recommendations")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "findPerfectProducts",
                "Find products perfect for your learning goals"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-left">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Bell className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {t("smartNotifications", "Smart Notifications")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "stayUpdated",
                "Stay updated on new products and special offers"
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-left">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Heart className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-sm">
              {t("curatedWishlist", "Curated Wishlist")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("saveTrackProducts", "Save and track products you love")}
            </p>
          </div>
        </div>
      </div>

      <Button onClick={onNext} className="w-full" size="lg">
        {t("letsGetStarted", "Let's Get Started")}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};

// Personal Info Step
const PersonalInfoStep: React.FC<OnboardingStepProps> = ({
  data,
  updateData,
  onNext,
  onSkip,
}) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAndNext = () => {
    const newErrors: Record<string, string> = {};

    if (!data.firstName.trim()) {
      newErrors.firstName = t("firstNameRequired", "First name is required");
    }
    if (!data.lastName.trim()) {
      newErrors.lastName = t("lastNameRequired", "Last name is required");
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <User className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">
          {t("tellUsAboutYourself", "Tell us about yourself")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "personalInfoDescription",
            "This helps us personalize your experience"
          )}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">{t("firstName", "First Name")} *</Label>
            <Input
              id="firstName"
              value={data.firstName}
              onChange={e => updateData({ firstName: e.target.value })}
              className={errors.firstName ? "border-red-500" : ""}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName">{t("lastName", "Last Name")} *</Label>
            <Input
              id="lastName"
              value={data.lastName}
              onChange={e => updateData({ lastName: e.target.value })}
              className={errors.lastName ? "border-red-500" : ""}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="dateOfBirth">
            {t("dateOfBirth", "Date of Birth")} ({t("optional", "Optional")})
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={data.dateOfBirth || ""}
            onChange={e => updateData({ dateOfBirth: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="phoneNumber">
            {t("phoneNumber", "Phone Number")} ({t("optional", "Optional")})
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={data.phoneNumber || ""}
            onChange={e => updateData({ phoneNumber: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onSkip} className="flex-1">
          {t("skip", "Skip")}
        </Button>
        <Button onClick={validateAndNext} className="flex-1">
          {t("continue", "Continue")}
        </Button>
      </div>
    </div>
  );
};

// Interests Step
const InterestsStep: React.FC<OnboardingStepProps> = ({
  data,
  updateData,
  onNext,
  onSkip,
}) => {
  const { t } = useTranslation();

  const toggleInterest = (interestId: string) => {
    const currentInterests = data.interests || [];
    const updatedInterests = currentInterests.includes(interestId)
      ? currentInterests.filter(id => id !== interestId)
      : [...currentInterests, interestId];

    updateData({ interests: updatedInterests });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">
          {t("whatInterestsYou", "What interests you?")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "selectInterestsDescription",
            "Select the STEM areas you're most interested in"
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {INTERESTS.map(interest => {
          const isSelected = data.interests?.includes(interest.id) || false;
          return (
            <Card
              key={interest.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              )}
              onClick={() => toggleInterest(interest.id)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">{interest.icon}</div>
                <p className="text-sm font-medium">{interest.label}</p>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary mx-auto mt-2" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onSkip} className="flex-1">
          {t("skip", "Skip")}
        </Button>
        <Button
          onClick={onNext}
          className="flex-1"
          disabled={(data.interests?.length || 0) === 0}
        >
          {t("continue", "Continue")} ({data.interests?.length || 0})
        </Button>
      </div>
    </div>
  );
};

// Age Groups Step
const AgeGroupsStep: React.FC<OnboardingStepProps> = ({
  data,
  updateData,
  onNext,
  onSkip,
}) => {
  const { t } = useTranslation();

  const toggleAgeGroup = (ageGroupId: string) => {
    const currentAgeGroups = data.ageGroups || [];
    const updatedAgeGroups = currentAgeGroups.includes(ageGroupId)
      ? currentAgeGroups.filter(id => id !== ageGroupId)
      : [...currentAgeGroups, ageGroupId];

    updateData({ ageGroups: updatedAgeGroups });
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <Users className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">
          {t("whoAreYouShoppingFor", "Who are you shopping for?")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "selectAgeGroupsDescription",
            "Select the age groups you're interested in"
          )}
        </p>
      </div>

      <div className="space-y-3">
        {AGE_GROUPS.map(ageGroup => {
          const isSelected = data.ageGroups?.includes(ageGroup.id) || false;
          return (
            <Card
              key={ageGroup.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              )}
              onClick={() => toggleAgeGroup(ageGroup.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium">{ageGroup.label}</span>
                {isSelected && <Check className="h-5 w-5 text-primary" />}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onSkip} className="flex-1">
          {t("skip", "Skip")}
        </Button>
        <Button
          onClick={onNext}
          className="flex-1"
          disabled={(data.ageGroups?.length || 0) === 0}
        >
          {t("continue", "Continue")} ({data.ageGroups?.length || 0})
        </Button>
      </div>
    </div>
  );
};

// Preferences Step
const PreferencesStep: React.FC<OnboardingStepProps> = ({
  data,
  updateData,
  onNext,
  onSkip,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <Target className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">
          {t("learningPreferences", "Learning Preferences")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "helpUsUnderstand",
            "Help us understand your learning goals and budget"
          )}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>{t("learningGoals", "Learning Goals")}</Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {LEARNING_GOALS.map(goal => {
              const isSelected = data.learningGoals?.includes(goal.id) || false;
              return (
                <div key={goal.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={checked => {
                      const currentGoals = data.learningGoals || [];
                      const updatedGoals = checked
                        ? [...currentGoals, goal.id]
                        : currentGoals.filter(id => id !== goal.id);
                      updateData({ learningGoals: updatedGoals });
                    }}
                  />
                  <Label className="text-sm cursor-pointer">{goal.label}</Label>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <Label>{t("budgetRange", "Budget Range")}</Label>
          <Select
            value={data.budgetRange || ""}
            onValueChange={value => updateData({ budgetRange: value })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue
                placeholder={t("selectBudgetRange", "Select budget range")}
              />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_RANGES.map(range => (
                <SelectItem key={range.id} value={range.id}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>
            {t(
              "shoppingFrequency",
              "How often do you shop for educational products?"
            )}
          </Label>
          <Select
            value={data.shoppingFrequency || ""}
            onValueChange={value => updateData({ shoppingFrequency: value })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue
                placeholder={t("selectFrequency", "Select frequency")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">{t("weekly", "Weekly")}</SelectItem>
              <SelectItem value="monthly">{t("monthly", "Monthly")}</SelectItem>
              <SelectItem value="quarterly">
                {t("quarterly", "Quarterly")}
              </SelectItem>
              <SelectItem value="annually">
                {t("annually", "Annually")}
              </SelectItem>
              <SelectItem value="rarely">{t("rarely", "Rarely")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onSkip} className="flex-1">
          {t("skip", "Skip")}
        </Button>
        <Button onClick={onNext} className="flex-1">
          {t("continue", "Continue")}
        </Button>
      </div>
    </div>
  );
};

// Notifications Step
const NotificationsStep: React.FC<OnboardingStepProps> = ({
  data,
  updateData,
  onNext,
}) => {
  const { t } = useTranslation();

  const updateNotificationSetting = (
    key: keyof OnboardingData["emailNotifications"],
    value: boolean
  ) => {
    updateData({
      emailNotifications: {
        ...data.emailNotifications,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <Bell className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">
          {t("stayInTheLoop", "Stay in the loop")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(
            "chooseNotificationPreferences",
            "Choose what you'd like to be notified about"
          )}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t("newsletter", "Newsletter")}</p>
            <p className="text-sm text-muted-foreground">
              {t("weeklySTEMTips", "Weekly STEM tips and ideas")}
            </p>
          </div>
          <Switch
            checked={data.emailNotifications.newsletter}
            onCheckedChange={checked =>
              updateNotificationSetting("newsletter", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t("promotions", "Promotions")}</p>
            <p className="text-sm text-muted-foreground">
              {t("specialOffersDeals", "Special offers and deals")}
            </p>
          </div>
          <Switch
            checked={data.emailNotifications.promotions}
            onCheckedChange={checked =>
              updateNotificationSetting("promotions", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t("orderUpdates", "Order Updates")}</p>
            <p className="text-sm text-muted-foreground">
              {t("shippingDeliveryUpdates", "Shipping and delivery updates")}
            </p>
          </div>
          <Switch
            checked={data.emailNotifications.orderUpdates}
            onCheckedChange={checked =>
              updateNotificationSetting("orderUpdates", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t("priceAlerts", "Price Alerts")}</p>
            <p className="text-sm text-muted-foreground">
              {t("priceDropsWishlist", "Price drops on your wishlist items")}
            </p>
          </div>
          <Switch
            checked={data.emailNotifications.priceAlerts}
            onCheckedChange={checked =>
              updateNotificationSetting("priceAlerts", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{t("newProducts", "New Products")}</p>
            <p className="text-sm text-muted-foreground">
              {t("newProductsInterests", "New products in your interests")}
            </p>
          </div>
          <Switch
            checked={data.emailNotifications.newProducts}
            onCheckedChange={checked =>
              updateNotificationSetting("newProducts", checked)
            }
          />
        </div>
      </div>

      <Button onClick={onNext} className="w-full">
        {t("continue", "Continue")}
      </Button>
    </div>
  );
};

// Completion Step
const CompletionStep: React.FC<
  OnboardingStepProps & { onComplete: () => void }
> = ({ data, onComplete }) => {
  const { t } = useTranslation();

  return (
    <div className="text-center space-y-6 max-w-md mx-auto">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-600 rounded-full" />
        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">
          {t("allSet", "You're all set!")}
        </h2>
        <p className="text-muted-foreground">
          {t(
            "onboardingCompleteText",
            "Your account is configured and ready to explore amazing STEM products."
          )}
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-sm">
          {t("yourPreferences", "Your Preferences:")}
        </h3>
        <div className="flex flex-wrap gap-1">
          {data.interests?.map(interest => {
            const interestData = INTERESTS.find(i => i.id === interest);
            return interestData ? (
              <Badge key={interest} variant="secondary" className="text-xs">
                {interestData.icon} {interestData.label}
              </Badge>
            ) : null;
          })}
        </div>
        {data.ageGroups && data.ageGroups.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.ageGroups.map(ageGroup => {
              const ageGroupData = AGE_GROUPS.find(ag => ag.id === ageGroup);
              return ageGroupData ? (
                <Badge key={ageGroup} variant="outline" className="text-xs">
                  {ageGroupData.label}
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>

      <Button onClick={onComplete} className="w-full" size="lg">
        {t("startShopping", "Start Shopping")}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome",
    description: "Welcome to STEM Toys",
    icon: Sparkles,
    component: WelcomeStep,
    required: true,
  },
  {
    id: "personal",
    title: "Personal Info",
    description: "Tell us about yourself",
    icon: User,
    component: PersonalInfoStep,
    required: true,
  },
  {
    id: "interests",
    title: "Interests",
    description: "What interests you?",
    icon: Lightbulb,
    component: InterestsStep,
  },
  {
    id: "age_groups",
    title: "Age Groups",
    description: "Who are you shopping for?",
    icon: Users,
    component: AgeGroupsStep,
  },
  {
    id: "preferences",
    title: "Preferences",
    description: "Learning goals and budget",
    icon: Target,
    component: PreferencesStep,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Stay updated",
    icon: Bell,
    component: NotificationsStep,
  },
];

export function UserOnboarding({
  isOpen,
  onComplete,
  onSkip,
  initialData = {},
  className,
}: UserOnboardingProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    firstName: "",
    lastName: "",
    interests: [],
    ageGroups: [],
    learningGoals: [],
    budgetRange: "",
    shoppingFrequency: "",
    emailNotifications: {
      newsletter: true,
      promotions: true,
      orderUpdates: true,
      priceAlerts: true,
      newProducts: true,
    },
    initialProducts: [],
    skipTutorial: false,
    completedSteps: [],
    ...initialData,
  });

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkipStep = useCallback(() => {
    handleNext();
  }, [handleNext]);

  const handleComplete = useCallback(async () => {
    setIsLoading(true);

    try {
      // Save onboarding data
      const response = await fetch("/api/account/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          completedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        onComplete(data);
        toast({
          title: t("welcomeToSTEMToys", "Welcome to STEM Toys!"),
          description: t(
            "accountSetupComplete",
            "Your account setup is complete. Start exploring!"
          ),
        });
      }
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      toast({
        title: t("error", "Error"),
        description: t(
          "failedToCompleteSetup",
          "Failed to complete setup. Please try again."
        ),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [data, onComplete, t]);

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const CurrentStepComponent = ONBOARDING_STEPS[currentStep]?.component;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("accountSetup", "Account Setup")}</DialogTitle>
        </DialogHeader>

        <div className={cn("space-y-6", className)}>
          {/* Progress Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}

              <div>
                <h2 className="font-semibold">
                  {ONBOARDING_STEPS[currentStep]?.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "stepXOfY",
                    `Step ${currentStep + 1} of ${ONBOARDING_STEPS.length}`
                  )}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              disabled={isLoading}
            >
              {t("skipSetup", "Skip Setup")}
              <X className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="h-2" />

          {/* Step Content */}
          <div className="py-8">
            {CurrentStepComponent && (
              <>
                {currentStep === ONBOARDING_STEPS.length ? (
                  <CompletionStep
                    data={data}
                    updateData={updateData}
                    onNext={handleNext}
                    onSkip={handleSkipStep}
                    onComplete={handleComplete}
                    isLoading={isLoading}
                  />
                ) : (
                  <CurrentStepComponent
                    data={data}
                    updateData={updateData}
                    onNext={handleNext}
                    onSkip={handleSkipStep}
                    isLoading={isLoading}
                  />
                )}
              </>
            )}
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center gap-2">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index <= currentStep ? "bg-primary" : "bg-gray-300"
                )}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
