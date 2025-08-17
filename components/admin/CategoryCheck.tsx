"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  checkCategoriesExist,
  createDefaultCategories,
} from "@/lib/utils/categories-utils";

export function CategoryCheck() {
  const [loading, setLoading] = useState(true);
  const [categoriesExist, setCategoriesExist] = useState(true);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const exists = await checkCategoriesExist();
        setCategoriesExist(exists);
      } catch (err) {
        setError("Failed to check categories");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    check();
  }, []);

  const handleCreateDefaults = async () => {
    try {
      setCreating(true);
      setError(null);

      const result = await createDefaultCategories();

      if (result) {
        setCategoriesExist(true);
        setCreated(true);
      } else if (result === null) {
        // This means categories already exist
        setCategoriesExist(true);
      }
    } catch (err) {
      setError("Failed to create default categories");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Checking categories...</AlertTitle>
        <AlertDescription>
          Please wait while we check if categories exist.
        </AlertDescription>
      </Alert>
    );
  }

  if (!categoriesExist) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No categories found</AlertTitle>
        <AlertDescription>
          <p className="mb-2">
            You need to create at least one category before you can create
            products.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleCreateDefaults}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Default Categories"}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/categories/new">Create Custom Category</Link>
            </Button>
          </div>
          {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
        </AlertDescription>
      </Alert>
    );
  }

  if (created) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle>Default categories created</AlertTitle>
        <AlertDescription>
          Default categories have been created successfully. You can now create
          products.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
