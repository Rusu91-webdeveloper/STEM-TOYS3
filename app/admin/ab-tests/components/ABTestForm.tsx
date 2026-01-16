"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ABTestType, ABTestAudience } from "@prisma/client";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    description: z.string().optional(),
    type: z.nativeEnum(ABTestType),
    targetAudience: z.nativeEnum(ABTestAudience),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    variants: z.array(z.object({
        name: z.string().min(1, "Variant name is required"),
        content: z.string().min(1, "Content is required"),
        weight: z.number().min(0).max(100),
        isControl: z.boolean().default(false),
    })).min(2, "At least 2 variants are required")
        .refine((variants) => {
            const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
            return Math.abs(totalWeight - 100) < 0.1;
        }, "Total weight must equal 100%")
        .refine((variants) => {
            return variants.filter((v) => v.isControl).length === 1;
        }, "Exactly one variant must be marked as Control"),
});

type FormValues = z.infer<typeof formSchema>;

interface ABTestFormProps {
    initialData?: any; // Partial<ABTest> & { variants: ABTestVariant[] }
    isEditing?: boolean;
}

export function ABTestForm({ initialData, isEditing = false }: ABTestFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultValues: Partial<FormValues> = initialData ? {
        name: initialData.name,
        description: initialData.description || "",
        type: initialData.type,
        targetAudience: initialData.targetAudience,
        startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
        endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
        variants: initialData.variants.map((v: any) => ({
            name: v.name,
            content: v.content,
            weight: v.weight,
            isControl: v.isControl,
        })),
    } : {
        name: "",
        description: "",
        type: "TITLE",
        targetAudience: "ALL",
        startDate: new Date(),
        variants: [
            { name: "Control (Original)", content: "Original Content", weight: 50, isControl: true },
            { name: "Variant B", content: "New Content", weight: 50, isControl: false },
        ],
    };

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: "onChange",
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "variants",
    });

    async function onSubmit(data: FormValues) {
        try {
            setIsSubmitting(true);
            const url = isEditing
                ?\`/api/admin/ab-tests/\${initialData.id}\`
        : "/api/admin/ab-tests";
      
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save test");
      }

      toast({
        title: "Success",
        description: `A / B Test ${ isEditing ? "updated" : "created" } successfully.`,
        variant: "default", 
      });

      router.push("/admin/ab-tests");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculate remaining weight helper
  const distributeWeights = () => {
    const currentVariants = form.getValues("variants");
    if (currentVariants.length === 0) return;
    const split = 100 / currentVariants.length;
    
    // Update all weights
    const newVariants = currentVariants.map(v => ({ ...v, weight: Number(split.toFixed(2)) }));
    // Fix rounding on last item
    const sum = newVariants.slice(0, -1).reduce((acc, v) => acc + v.weight, 0);
    newVariants[newVariants.length - 1].weight = Number((100 - sum).toFixed(2));
    
    form.setValue("variants", newVariants);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Detalii Generale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nume Test</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Homepage Hero CTA Red" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descriere (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ce testăm și de ce?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tip Test</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează tipul" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.keys(ABTestType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audiență</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectează audiența" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {Object.keys(ABTestAudience).map((audience) => (
                            <SelectItem key={audience} value={audience}>
                              {audience}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Variante</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={distributeWeights} title="Distribuie egal greutatea">
                Rebalansează %
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4 bg-muted/20">
                    <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-sm">Varianta {index + 1}</div>
                        {fields.length > 2 && (
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <FormField
                        control={form.control}
                        name={`variants.${ index }.name`}
                        render={({ field }) => (
                        <FormItem>
                            <FormControl>
                            <Input placeholder="Nume Varianta" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`variants.${ index }.weight`}
                        render={({ field }) => (
                        <FormItem>
                            <FormControl>
                            <div className="relative">
                                <Input type="number" placeholder="%" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                            </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`variants.${ index }.content`}
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                        <Input placeholder="Valoare / Content ID / URL" {...field} />
                        </FormControl>
                        <FormDescription className="text-xs">
                           Ce se schimbă? (Text, URL, Culoare, JSON)
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`variants.${ index }.isControl`}
                    render={({ field }) => (
                        <div className="flex items-center space-x-2 mt-2">
                            <input 
                                type="checkbox" 
                                id={`control - ${ index } `} 
                                checked={field.value} 
                                onChange={(e) => {
                                    // If checking this, uncheck others manually or let validation handle it
                                    // Better UX: uncheck others
                                    if (e.target.checked) {
                                        const currentVariants = form.getValues("variants");
                                        const updated = currentVariants.map((v, idx) => ({ ...v, isControl: idx === index }));
                                        form.setValue("variants", updated);
                                    } else {
                                        field.onChange(false);
                                    }
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <label htmlFor={`control - ${ index } `} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Este Control (Original)
                            </label>
                        </div>
                    )}
                  />
                  
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => append({ name: `New Variant`, content: "", weight: 0, isControl: false })}
              >
                <Plus className="mr-2 h-4 w-4" /> Adaugă Variantă
              </Button>
              
               <div className="text-sm font-medium text-right">
                  Total Weight: <span className={cn(
                      Math.abs(form.watch("variants").reduce((sum, v) => sum + (v.weight || 0), 0) - 100) < 0.1 ? "text-green-600" : "text-red-500"
                  )}>
                      {form.watch("variants").reduce((sum, v) => sum + (v.weight || 0), 0).toFixed(2)}%
                  </span>
               </div>
               {form.formState.errors.variants?.root && (
                  <p className="text-sm text-red-500 text-right">{form.formState.errors.variants.root.message}</p>
               )}

            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Test" : "Create Test"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
