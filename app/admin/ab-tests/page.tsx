import { Plus, BarChart3, Play, Pause, AlertCircle } from "lucide-react";
import Link from "next/link";
import React from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ABTestingService } from "@/lib/services/ab-testing-service";
import { ABTestType, ABTestStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminABTestsPage() {
    const tests = await ABTestingService.getAllTests();

    const runningTests = tests.filter(t => t.status === "RUNNING");
    const draftTests = tests.filter(t => t.status === "DRAFT");
    const completedTests = tests.filter(t => t.status === "COMPLETED");

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
                    <p className="text-muted-foreground">
                        Gestionează experimentele pentru optimizarea conversiei
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/ab-tests/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Test Nou
                    </Link>
                </Button>
            </div>

            {/* Summary Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Teste Active</CardTitle>
                        <Play className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{runningTests.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Experimente în derulare
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                        <Pause className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{draftTests.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Pregătite pentru lansare
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Finalizate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedTests.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Experimente încheiate
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Toate Testele</CardTitle>
                    <CardDescription>
                        Lista tuturor experimentelor A/B create în platformă.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nume Test</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tip Context</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead className="text-right">Acțiuni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nu există teste create. Începe prin a crea un test nou.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tests.map((test) => (
                                    <TableRow key={test.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/admin/ab-tests/${test.id}`} className="hover:underline">
                                                {test.name}
                                            </Link>
                                            {test.description && (
                                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {test.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={test.status} />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{test.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {test.startDate ? format(test.startDate, "d MMM yyyy", { locale: ro }) : "-"}
                                        </TableCell>
                                        <TableCell>
                                            {test.endDate ? format(test.endDate, "d MMM yyyy", { locale: ro }) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button asChild variant="ghost" size="sm">
                                                <Link href={`/admin/ab-tests/${test.id}`}>Detalii</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function StatusBadge({ status }: { status: ABTestStatus }) {
    switch (status) {
        case "RUNNING":
            return <Badge className="bg-green-500">Activ</Badge>;
        case "PAUSED":
            return <Badge variant="secondary" className="text-yellow-600 bg-yellow-100">Pauză</Badge>;
        case "COMPLETED":
            return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Finalizat</Badge>;
        case "STOPPED":
            return <Badge variant="destructive">Oprit</Badge>;
        default:
            return <Badge variant="outline">Draft</Badge>;
    }
}
