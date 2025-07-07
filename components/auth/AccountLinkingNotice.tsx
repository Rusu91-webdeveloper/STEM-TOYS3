"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { useToast } from "@/components/ui/use-toast";

export function AccountLinkingNotice() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [noticeShown, setNoticeShown] = useState(false);

  useEffect(() => {
    // Check if the user has linked their account and if the notice has not been shown yet
    if (session?.user?.accountLinked && !noticeShown) {
      // Mark the notice as shown to prevent it from showing again
      setNoticeShown(true);

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
  }, [session, toast, router, noticeShown]);

  // This component doesn't render anything visible
  return null;
}
