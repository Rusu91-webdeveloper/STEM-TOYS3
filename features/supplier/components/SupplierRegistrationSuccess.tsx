"use client";

import Link from "next/link";
import {
  CheckCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const nextSteps = [
  {
    step: "01",
    title: "Application Review",
    description:
      "Our team validates company credentials, certifications, and catalogue readiness.",
    duration: "2-3 business days",
    icon: FileText,
  },
  {
    step: "02",
    title: "Quality Assessment",
    description:
      "We audit product quality, educational positioning, and brand assets to ensure STEM alignment.",
    duration: "3-5 business days",
    icon: Users,
  },
  {
    step: "03",
    title: "Final Decision",
    description:
      "Receive your approval outcome alongside clear feedback and next-step instructions.",
    duration: "1-2 business days",
    icon: CheckCircle,
  },
  {
    step: "04",
    title: "Onboarding",
    description:
      "If approved, we schedule a concierge kickoff covering account setup, merchandising, and launch planning.",
    duration: "1-2 weeks",
    icon: TrendingUp,
  },
] as const;

const contacts = [
  {
    icon: Mail,
    title: "Email Support",
    description: "supplier@techtots.ro",
    action: "Send us an email",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "+40 XXX XXX XXX",
    action: "Call us directly",
  },
] as const;

export function SupplierRegistrationSuccess() {
  return (
    <>
      <section className="container mx-auto max-w-4xl px-4 pb-12 pt-20 sm:px-6 lg:pb-16 lg:pt-24">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
            <CheckCircle className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Application submitted successfully!
          </h1>
          <p className="mt-4 text-sm text-slate-200 sm:text-base">
            Thank you for your interest in becoming a TechTots supplier. Our partnership team will review your application shortly.
          </p>
          <Badge className="mt-5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 sm:text-sm">
            <Clock className="mr-2 h-4 w-4" />
            Review window: 5-7 business days
          </Badge>
        </div>

        <Card className="mt-10 rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl text-white">
              <Clock className="h-6 w-6 text-sky-300" />
              What happens next?
            </CardTitle>
            <CardDescription className="text-sm text-slate-200">
              A transparent view of the TechTots review and onboarding pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {nextSteps.map(step => (
              <div
                key={step.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/20"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <Badge className="rounded-full border border-white/20 bg-white/10 text-xs text-slate-200">
                      Step {step.step}
                    </Badge>
                    <Badge className="ml-2 rounded-full border border-white/20 bg-white/10 text-xs text-slate-200">
                      {step.duration}
                    </Badge>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-200">{step.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg text-white">
                <Mail className="h-5 w-5 text-sky-300" />
                Email confirmation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-sky-300/40 bg-sky-500/10 p-4 text-sky-100">
                <strong>Important:</strong> check your inbox (and spam folder) for our confirmation email containing your reference number.
              </div>
              <div>
                <h4 className="font-semibold text-white">You will receive:</h4>
                <ul className="mt-2 space-y-1 text-xs sm:text-sm">
                  <li>• Application confirmation with reference ID</li>
                  <li>• Expected review timeline and next steps</li>
                  <li>• Contact details for partnership questions</li>
                  <li>• Checklist for preparing catalog and assets</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/15 via-emerald-600/20 to-teal-600/20 shadow-lg shadow-emerald-800/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg text-white">
                <Phone className="h-5 w-5 text-emerald-200" />
                Need help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-emerald-100">
                Our partnership team is available to answer questions while your application is under review.
              </p>
              <div className="space-y-3">
                {contacts.map(contact => (
                  <div
                    key={contact.title}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-100"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                      <contact.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{contact.title}</p>
                      <p className="text-xs text-emerald-100">{contact.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10 rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/25">
          <CardHeader>
            <CardTitle className="text-lg text-white">Application details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-semibold text-sky-200">
                {new Date().toLocaleDateString()}
              </p>
              <p className="mt-1 text-xs text-slate-200">Submission date</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-semibold text-sky-200">
                SUP-{Date.now().toString().slice(-6)}
              </p>
              <p className="mt-1 text-xs text-slate-200">Reference ID</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-semibold text-sky-200">48h SLA</p>
              <p className="mt-1 text-xs text-slate-200">Initial response window</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400 sm:text-base"
          >
            <Link href="/supplier">Return to supplier hub</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-2xl border border-white/40 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 sm:text-base"
          >
            <Link href="/supplier/support">Contact partnership team</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
