import { notFound } from "next/navigation";
import { ABTestingService } from "@/lib/services/ab-testing-service";
import { ABTestDashboard } from "../components/ABTestDashboard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ABTestDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const test = await ABTestingService.getTestById(id);

    if (!test) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <Button variant="ghost" className="pl-0" asChild>
                <Link href="/admin/ab-tests">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Înapoi la Teste
                </Link>
            </Button>

            <ABTestDashboard test={test as any} />
            {/* 
        Type casting as any because the service return type might 
        differ slightly in strictness from what the component expects,
        specifically around the highly nested relations.
        The service returns `include: { variants: true, metrics: true, results: true }`
        We need to ensure metrics are also included on variants if assumed by dashboard.
        
        Looking at ABTestingService `getTestById`, it does:
        include: { variants: { include: { metrics: true } }, metrics: true, results: true }
        So the structure matches ABTestDashboardProps.
       */}
        </div>
    );
}
