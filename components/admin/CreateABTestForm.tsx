"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { ABTestType, ABTestAudience } from "@prisma/client";
import { useRouter } from "next/navigation";

interface Variant {
  id: string;
  name: string;
  content: string;
  weight: number;
  isControl: boolean;
}

export function CreateABTestForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "TITLE" as ABTestType,
    targetAudience: "ALL" as ABTestAudience,
  });
  const [variants, setVariants] = useState<Variant[]>([
    {
      id: "1",
      name: "Control",
      content: "",
      weight: 50,
      isControl: true,
    },
    {
      id: "2",
      name: "Variant A",
      content: "",
      weight: 50,
      isControl: false,
    },
  ]);
  const router = useRouter();

  const addVariant = () => {
    const newVariant: Variant = {
      id: Date.now().toString(),
      name: `Variant ${variants.length}`,
      content: "",
      weight: 0,
      isControl: false,
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (id: string) => {
    if (variants.length <= 2) return;
    setVariants(variants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof Variant, value: any) => {
    setVariants(
      variants.map(v => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const setControlVariant = (id: string) => {
    setVariants(
      variants.map(v => ({
        ...v,
        isControl: v.id === id,
      }))
    );
  };

  const distributeWeights = () => {
    const weightPerVariant = Math.floor(100 / variants.length);
    const remainder = 100 - weightPerVariant * variants.length;

    setVariants(
      variants.map((v, index) => ({
        ...v,
        weight: weightPerVariant + (index < remainder ? 1 : 0),
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/ab-testing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          variants: variants.map(({ id, ...variant }) => variant),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create A/B test");
      }

      router.refresh();
      // Reset form
      setFormData({
        name: "",
        description: "",
        type: "TITLE",
        targetAudience: "ALL",
      });
      setVariants([
        {
          id: "1",
          name: "Control",
          content: "",
          weight: 50,
          isControl: true,
        },
        {
          id: "2",
          name: "Variant A",
          content: "",
          weight: 50,
          isControl: false,
        },
      ]);
    } catch (error) {
      console.error("Error creating A/B test:", error);
      alert("Failed to create A/B test. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const hasControl = variants.some(v => v.isControl);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New A/B Test</CardTitle>
        <CardDescription>
          Set up a new A/B test to optimize your Romanian STEM content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Test Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Romanian Title Optimization"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this test is trying to optimize..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Test Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ABTestType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TITLE">Title</SelectItem>
                    <SelectItem value="CONTENT">Content</SelectItem>
                    <SelectItem value="CALL_TO_ACTION">
                      Call to Action
                    </SelectItem>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="STRUCTURE">Structure</SelectItem>
                    <SelectItem value="LAYOUT">Layout</SelectItem>
                    <SelectItem value="PRICING">Pricing</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <Select
                  value={formData.targetAudience}
                  onValueChange={(value: ABTestAudience) =>
                    setFormData({ ...formData, targetAudience: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Users</SelectItem>
                    <SelectItem value="ROMANIAN">Romanian Users</SelectItem>
                    <SelectItem value="NEW_USERS">New Users</SelectItem>
                    <SelectItem value="RETURNING_USERS">
                      Returning Users
                    </SelectItem>
                    <SelectItem value="MOBILE_USERS">Mobile Users</SelectItem>
                    <SelectItem value="DESKTOP_USERS">Desktop Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Test Variants</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={distributeWeights}
                  disabled={variants.length < 2}
                >
                  Auto-distribute weights
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variant
                </Button>
              </div>
            </div>

            {variants.map((variant, index) => (
              <div key={variant.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">
                      Variant {index + 1}
                    </Label>
                    {variant.isControl && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Control
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!variant.isControl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setControlVariant(variant.id)}
                      >
                        Set as Control
                      </Button>
                    )}
                    {variants.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeVariant(variant.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`variant-${variant.id}-name`}>Name</Label>
                    <Input
                      id={`variant-${variant.id}-name`}
                      value={variant.name}
                      onChange={e =>
                        updateVariant(variant.id, "name", e.target.value)
                      }
                      placeholder="Variant name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`variant-${variant.id}-weight`}>
                      Weight (%) - Total: {totalWeight}%
                    </Label>
                    <Input
                      id={`variant-${variant.id}-weight`}
                      type="number"
                      min="0"
                      max="100"
                      value={variant.weight}
                      onChange={e =>
                        updateVariant(
                          variant.id,
                          "weight",
                          Number(e.target.value)
                        )
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`variant-${variant.id}-content`}>
                    Content
                  </Label>
                  <Textarea
                    id={`variant-${variant.id}-content`}
                    value={variant.content}
                    onChange={e =>
                      updateVariant(variant.id, "content", e.target.value)
                    }
                    placeholder="Enter the content for this variant..."
                    required
                  />
                </div>
              </div>
            ))}

            {!hasControl && (
              <p className="text-sm text-red-600">
                ⚠️ You must have exactly one control variant
              </p>
            )}

            {totalWeight !== 100 && (
              <p className="text-sm text-red-600">
                ⚠️ Variant weights must sum to 100% (currently {totalWeight}%)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !hasControl ||
                totalWeight !== 100 ||
                variants.length < 2
              }
            >
              {isLoading ? "Creating..." : "Create A/B Test"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
