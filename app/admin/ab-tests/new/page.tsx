import React from "react";
import { ABTestForm } from "../components/ABTestForm";

export default function NewABTestPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Creează Test Nou</h1>
                <p className="text-muted-foreground">
                    Definește detaliile experimentului și variantele de testare.
                </p>
            </div>
            <ABTestForm />
        </div>
    );
}
