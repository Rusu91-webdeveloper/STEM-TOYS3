"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function NotFoundClient() {
  const router = useRouter();

  return (
    <div className="pt-8">
      <Button
        onClick={() => router.back()}
        variant="ghost"
        className="text-gray-600 hover:text-gray-900"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Înapoi la pagina anterioară
      </Button>
    </div>
  );
}
