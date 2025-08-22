import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Home,
  Package,
  BookOpen,
} from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            You're Offline
          </CardTitle>
          <CardDescription className="text-gray-600">
            Don't worry! You can still browse cached content and explore STEM
            Toys.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              While you're offline, you can:
            </p>

            <div className="space-y-2 text-left">
              <div className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50">
                <Home className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Browse the home page
                </span>
              </div>

              <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-50">
                <Package className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  View cached products
                </span>
              </div>

              <div className="flex items-center space-x-3 p-2 rounded-lg bg-purple-50">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-800">
                  Read cached blog posts
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>

            <div className="flex space-x-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </Button>

              <Button asChild variant="outline" className="flex-1">
                <Link href="/products">
                  <Package className="w-4 h-4 mr-2" />
                  Products
                </Link>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <Wifi className="w-3 h-3" />
              <span>Check your internet connection</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
