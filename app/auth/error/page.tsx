"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get("error") || "unknown";

  const errorMessages = {
    missing_token: "Tokenul de verificare lipsește.",
    invalid_token: "Tokenul de verificare este invalid sau a expirat.",
    server_error: "A apărut o eroare de server în timpul verificării.",
    unknown: "A apărut o eroare necunoscută.",
  };

  const errorMessage =
    errorMessages[errorType as keyof typeof errorMessages] ||
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
        <CardContent>
          <p className="text-center text-muted-foreground mb-4">
            {errorMessage}
          </p>
          <p className="text-center text-sm">
            Dacă întâmpini probleme la verificarea contului, contactează echipa
            de suport sau încearcă să te înregistrezi din nou.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            asChild
            className="w-full">
            <Link href="/auth/login">Mergi la autentificare</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full">
            <Link href="/auth/register">Înregistrează-te din nou</Link>
          </Button>
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
      }>
      <AuthErrorContent />
    </Suspense>
  );
}
