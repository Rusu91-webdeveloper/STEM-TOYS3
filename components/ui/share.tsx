"use client";

import {
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Link2,
  Copy,
  Instagram,
} from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

// Custom TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

interface ShareProps {
  url: string;
  title: string;
  text?: string;
  className?: string;
  blogId?: string;
  contentType?: "blog" | "product" | "category";
}

export function Share({
  url,
  title,
  text = "",
  className,
  blogId,
  contentType,
}: ShareProps) {
  const { toast } = useToast();

  // Track Facebook Pixel event for sharing
  const trackShareEvent = (platform: string) => {
    if (typeof window !== "undefined" && window.trackViralShare && blogId) {
      window.trackViralShare(blogId, platform);
    }

    // Also track via social media analytics API
    if (blogId && contentType === "blog") {
      fetch("/api/admin/analytics/social-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventName: "ViralShare",
          platform,
          contentIds: [blogId],
          contentType: "blog_post",
          customData: {
            viralContent: true,
            romanianMarket: true,
            stemEducation: true,
            url,
            title,
          },
        }),
      }).catch(console.error);
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      url
    )}&text=${encodeURIComponent(title + (text ? ` - ${text}` : ""))}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
    trackShareEvent("twitter");
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
    trackShareEvent("facebook");
  };

  const shareToLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}`;
    window.open(linkedinUrl, "_blank", "width=600,height=400");
    trackShareEvent("linkedin");
  };

  const shareToInstagram = () => {
    // Instagram doesn't have a direct share API, so we'll copy the URL
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copied for Instagram!",
        description: "Paste this link in your Instagram story or post.",
      });
    });
    trackShareEvent("instagram");
  };

  const shareToTikTok = () => {
    // TikTok doesn't have a direct share API, so we'll copy the URL
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copied for TikTok!",
        description: "Paste this link in your TikTok video description.",
      });
    });
    trackShareEvent("tiktok");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
      });
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log("Native share failed:", error);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {typeof navigator !== "undefined" && "share" in navigator && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={shareToTwitter}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>

        <DropdownMenuItem onClick={shareToFacebook}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>

        <DropdownMenuItem onClick={shareToLinkedIn}>
          <Linkedin className="h-4 w-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>

        <DropdownMenuItem onClick={shareToInstagram}>
          <Instagram className="h-4 w-4 mr-2" />
          Instagram
        </DropdownMenuItem>

        <DropdownMenuItem onClick={shareToTikTok}>
          <TikTokIcon className="h-4 w-4 mr-2" />
          TikTok
        </DropdownMenuItem>

        <DropdownMenuItem onClick={copyToClipboard}>
          <Copy className="h-4 w-4 mr-2" />
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
