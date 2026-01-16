"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Play, Pause, Square, Trophy, Users, MousePointer, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import type { ABTest, ABTestVariant, ABTestMetrics, ABTestResult } from "@prisma/client";

type ABTestWithRelations = ABTest & {
    variants: (ABTestVariant & { metrics: ABTestMetrics[] })[];
    results: ABTestResult | null;
    metrics: ABTestMetrics[]; // Test level aggregated metrics usually not stored directly but we have relations
};

interface ABTestDashboardProps {
    test: ABTestWithRelations;
}

export function ABTestDashboard({ test }: ABTestDashboardProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    // Aggregate metrics
    const totalImpressions = test.variants.reduce((sum, v) => sum + (v.metrics[0]?.impressions || 0), 0);
    const totalConversions = test.variants.reduce((sum, v) => sum + (v.metrics[0]?.conversions || 0), 0);
    const overallCR = totalImpressions > 0 ? (totalConversions / totalImpressions) * 100 : 0;

    async function handleStatusChange(action: "START" | "PAUSE" | "STOP") {
        try {
            setIsUpdating(true);
            const response = await fetch(\`/api/admin/ab-tests/\${test.id}/status\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error("Failed to update status");
      
      toast({
        title: "Status Updated",
        description: `Test status changed to ${ action }`,
      });
      
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update test status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  // Find winner if any
  const winnerVariant = test.results?.winnerVariantId 
    ? test.variants.find(v => v.id === test.results?.winnerVariantId) 
    : null;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold">{test.name}</h2>
              <Badge variant={test.status === "RUNNING" ? "default" : "secondary"}>
                {test.status}
              </Badge>
           </div>
           <p className="text-muted-foreground">{test.description}</p>
        </div>
        <div className="flex gap-2">
            {test.status === "DRAFT" || test.status === "PAUSED" ? (
                <Button onClick={() => handleStatusChange("START")} disabled={isUpdating} className="bg-green-600 hover:bg-green-700">
                    <Play className="mr-2 h-4 w-4" /> Start Test
                </Button>
            ) : null}
            
            {test.status === "RUNNING" && (
                <Button onClick={() => handleStatusChange("PAUSE")} disabled={isUpdating} variant="outline" className="border-yellow-500 text-yellow-600">
                    <Pause className="mr-2 h-4 w-4" /> Pause
                </Button>
            )}

            {(test.status === "RUNNING" || test.status === "PAUSED") && (
                <Button onClick={() => handleStatusChange("STOP")} disabled={isUpdating} variant="destructive">
                    <Square className="mr-2 h-4 w-4 fill-current" /> Stop & Conclude
                </Button>
            )}
        </div>
      </div>

       {/* Results Banner */}
       {test.status === "COMPLETED" && (
          <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="pt-6 flex flex-col md:flex-row items-center gap-6">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Trophy className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-blue-900">Test Finalizat!</h3>
                      <p className="text-blue-700">
                          {winnerVariant ? (
                             <>Câștigătorul este <strong>{winnerVariant.name}</strong> cu o încredere statistică de <strong>{(test.results?.confidence || 0).toFixed(1)}%</strong>.</>
                          ) : (
                              "Nu a fost declarat un câștigător clar (rezultate neconcludente)."
                          )}
                      </p>
                      {test.results?.recommendations && test.results.recommendations.length > 0 && (
                          <ul className="mt-2 list-disc list-inside text-sm text-blue-600">
                              {test.results.recommendations.map((rec: string, i: number) => (
                                  <li key={i}>{rec}</li>
                              ))}
                          </ul>
                      )}
                  </div>
              </CardContent>
          </Card>
      )}

      {/* Main Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impresii Totale</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversii Totale</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rată Conversie (Avg)</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{overallCR.toFixed(2)}%</div>
            </CardContent>
        </Card>
      </div>

      {/* Variants List */}
      <div className="grid gap-6">
        <h3 className="text-lg font-semibold">Performanță Variante</h3>
        {test.variants.map((variant) => {
             const metrics = variant.metrics[0] || { impressions: 0, clicks: 0, conversions: 0 };
             const cr = metrics.impressions > 0 ? (metrics.conversions / metrics.impressions) * 100 : 0;
             const isWinner = variant.isWinner;
             
             return (
                 <Card key={variant.id} className={\`overflow-hidden \${isWinner ? 'border-green-500 ring-1 ring-green-500' : ''}\`}>
                     <CardHeader className="pb-2 bg-muted/40">
                         <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                                <CardTitle className="text-base">{variant.name}</CardTitle>
                                {variant.isControl && <Badge variant="outline">Control</Badge>}
                                {isWinner && <Badge className="bg-green-600">Winner</Badge>}
                             </div>
                             <div className="text-sm text-muted-foreground">Greutate: {variant.weight}%</div>
                         </div>
                     </CardHeader>
                     <CardContent className="pt-4 grid md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-xs text-muted-foreground">Conținut</div>
                            <div className="font-medium truncate max-w-[200px]" title={variant.content}>{variant.content}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Impresii</div>
                            <div className="font-mono">{metrics.impressions}</div>
                        </div>
                        <div>
                             <div className="text-xs text-muted-foreground">Conversii</div>
                             <div className="font-mono">{metrics.conversions}</div>
                        </div>
                        <div>
                             <div className="text-xs text-muted-foreground">Conversion Rate</div>
                             <div className="flex items-center gap-2">
                                <span className={cn(
                                    "font-bold",
                                    cr > overallCR ? "text-green-600" : "text-muted-foreground"
                                )}>{cr.toFixed(2)}%</span>
                                <Progress value={cr * 20} className="h-2 w-20" /> 
                                {/* *20 is arbitrary scaling for visual bar */}
                             </div>
                        </div>
                     </CardContent>
                 </Card>
             );
        })}
      </div>
    </div>
  );
}

// Utility class merger (should be imported but simple enough to redefine or import if needed)
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
