"use client";

import { AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get("error") || "unknown";

  const errorMessages = {
    Configuration: {
      title: "Eroare de Configurare",
      message: "Configurația de autentificare este incompletă sau incorectă.",
      description:
        "Aceasta se întâmplă de obicei când lipsesc variabilele de mediu necesare.",
      solutions: [
        "Verifică că NEXTAUTH_URL este setat corect în Vercel",
        "Verifică că NEXTAUTH_SECRET este configurat",
        "Verifică că GOOGLE_CLIENT_ID și GOOGLE_CLIENT_SECRET sunt setate",
        "Verifică că URL-ul de redirect în Google OAuth este corect",
      ],
    },
    missing_token: {
      title: "Token Lipsă",
      message: "Tokenul de verificare lipsește.",
      description: "Link-ul de verificare este incomplet sau corupt.",
      solutions: ["Solicită un nou email de verificare"],
    },
    invalid_token: {
      title: "Token Invalid",
      message: "Tokenul de verificare este invalid sau a expirat.",
      description: "Link-ul de verificare nu mai este valid.",
      solutions: ["Solicită un nou email de verificare"],
    },
    server_error: {
      title: "Eroare de Server",
      message: "A apărut o eroare de server în timpul verificării.",
      description: "Problemă temporară cu serverul.",
      solutions: ["Încearcă din nou peste câteva momente"],
    },
    unknown: {
      title: "Eroare Necunoscută",
      message: "A apărut o eroare necunoscută.",
      description: "Tipul erorii nu a fost identificat.",
      solutions: ["Contactează suportul pentru asistență"],
    },
  };

  const errorInfo =
    errorMessages[errorType as keyof typeof errorMessages] ??
    errorMessages.unknown;

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Verificare eșuată
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-lg mb-2">{errorInfo.title}</h3>
            <p className="text-muted-foreground mb-2">{errorInfo.message}</p>
            <p className="text-sm text-gray-600">{errorInfo.description}</p>
          </div>

          {errorInfo.solutions && errorInfo.solutions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Soluții:</h4>
              <ul className="text-sm space-y-1">
                {errorInfo.solutions.map((solution, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>{solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {errorType === "Configuration" && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800 font-medium mb-2">
                🔧 Diagnostic Rapid:
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link
                  href="/debug-auth"
                  className="flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Verifică Configurația
                </Link>
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-gray-500">
            <p>
              Dacă întâmpini probleme la verificarea contului, contactează
              echipa de suport sau încearcă să te înregistrezi din nou.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link href="/auth/login">Mergi la autentificare</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/register">Înregistrează-te din nou</Link>
          </Button>
          {errorType === "Configuration" && (
            <Button asChild variant="secondary" className="w-full">
              <Link href="/debug-auth">Diagnostichează Problema</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex items-center justify-center min-h-screen py-12">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold text-center">
                Loading...
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
