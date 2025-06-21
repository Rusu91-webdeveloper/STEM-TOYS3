"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

export function AccountLinkingNotice() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Check if the user has linked their account with Google
    if (session?.user?.accountLinked) {
      // Customize message based on role
      const isAdmin = session.user.role === "ADMIN";

      // Show a toast notification
      toast({
        title: "Account linked with Google",
        description: isAdmin
          ? "Your admin account has been linked to Google. Your admin privileges are preserved."
          : "Your existing account has been linked to Google. You can now sign in with either method.",
        variant: "default",
        duration: 5000,
      });

      // Redirect to account page to prevent the notice from showing repeatedly
      router.push("/account");
    }
  }, [session, toast, router]);

  // This component doesn't render anything visible
  return null;
}
