"use client";

import {
  Sparkles,
  Loader2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  GeneratedBlogContent,
  BlogGenerationProgress,
} from "@/lib/ai/blog-types";

interface AIBlogGeneratorProps {
  onBlogGenerated?: (blog: GeneratedBlogContent) => void;
  trigger?: React.ReactNode;
}

export default function AIBlogGenerator({
  onBlogGenerated,
  trigger,
}: AIBlogGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<BlogGenerationProgress | null>(null);
  const [generatedBlog, setGeneratedBlog] =
    useState<GeneratedBlogContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [prompt, setPrompt] = useState("");
  const [stemCategory, setStemCategory] = useState<string>("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("educational");
  const [includeSEO, setIncludeSEO] = useState(true);
  const [includeCoverImage, setIncludeCoverImage] = useState(true);
  const [includeCallToAction, setIncludeCallToAction] = useState(true);
  const [saveToDatabase, setSaveToDatabase] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);

  const resetForm = () => {
    setPrompt("");
    setStemCategory("");
    setTargetAudience("");
    setTone("educational");
    setIncludeSEO(true);
    setIncludeCoverImage(true);
    setIncludeCallToAction(true);
    setSaveToDatabase(false);
    setAutoPublish(false);
    setGeneratedBlog(null);
    setError(null);
    setProgress(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt for blog generation");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedBlog(null);
    setProgress(null);

    try {
      const requestBody = {
        prompt: prompt.trim(),
        options: {
          includeSEO,
          includeCoverImage,
          targetStemCategory: stemCategory ?? undefined,
          targetAudience: targetAudience ?? undefined,
          tone,
          includeCallToAction,
          saveToDatabase,
          autoPublish,
        },
      };

      const response = await fetch("/api/admin/blog/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate blog");
      }

      const data = await response.json();

      if (data.success && data.generatedBlog) {
        setGeneratedBlog(data.generatedBlog);
        onBlogGenerated?.(data.generatedBlog);
      } else {
        throw new Error(data.error ?? "Blog generation failed");
      }
    } catch (err) {
      console.error("Blog generation error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!generatedBlog) return;

    setIsGenerating(true);
    setError(null);

    try {
      const requestBody = {
        prompt: generatedBlog.aiMetadata.originalPrompt,
        options: {
          includeSEO: true,
          includeCoverImage: true,
          targetStemCategory: generatedBlog.stemCategory,
          saveToDatabase: true,
          autoPublish: false,
        },
      };

      const response = await fetch("/api/admin/blog/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error ?? "Failed to save blog");
      }

      const data = await response.json();

      if (data.success && data.savedBlog) {
        // Show success message (could be replaced with a toast notification)
        setError(null); // Clear any existing errors
        setIsOpen(false);
        resetForm();
        // Optionally refresh the blog list
        window.location.reload();
      } else {
        throw new Error(data.error ?? "Failed to save blog");
      }
    } catch (err) {
      console.error("Blog save error:", err);
      setError(err instanceof Error ? err.message : "Failed to save blog");
    } finally {
      setIsGenerating(false);
    }
  };

  const getStemCategoryColor = (category: string) => {
    switch (category) {
      case "SCIENCE":
        return "bg-blue-100 text-blue-800";
      case "TECHNOLOGY":
        return "bg-green-100 text-green-800";
      case "ENGINEERING":
        return "bg-yellow-100 text-yellow-800";
      case "MATHEMATICS":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProgressMessage = (stage: string) => {
    switch (stage) {
      case "analyzing_prompt":
        return "Analyzing your prompt...";
      case "generating_content":
        return "Generating blog content...";
      case "optimizing_seo":
        return "Optimizing SEO metadata...";
      case "refining_language":
        return "Refining Romanian language...";
      case "finalizing":
        return "Finalizing blog post...";
      default:
        return "Generating blog...";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
            AI Blog Generator
          </DialogTitle>
          <DialogDescription>
            Generate SEO-optimized blog posts in Romanian using AI. Simply
            describe what you want the blog to be about.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Generation Progress */}
          {isGenerating && progress && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Generating Blog...</h3>
                    <Badge variant="secondary">
                      {Math.round(progress.progress)}%
                    </Badge>
                  </div>
                  <Progress value={progress.progress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    {getProgressMessage(progress.stage)}
                  </p>
                  {progress.currentStep && (
                    <p className="text-xs text-muted-foreground">
                      {progress.currentStep}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generation Form */}
          {!generatedBlog && !isGenerating && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="prompt" className="text-base font-medium">
                  Blog Prompt *
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., 'I want you to generate for me a blog about STEM toys in 2025' or 'I need you to explain in a blog post the importance of STEM toys'"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  className="min-h-[100px] mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Describe what you want the blog post to be about. Be specific
                  about the topic, target audience, and key points to cover.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stem-category">STEM Category</Label>
                  <Select value={stemCategory} onValueChange={setStemCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCIENCE">Science (Știință)</SelectItem>
                      <SelectItem value="TECHNOLOGY">
                        Technology (Tehnologie)
                      </SelectItem>
                      <SelectItem value="ENGINEERING">
                        Engineering (Inginerie)
                      </SelectItem>
                      <SelectItem value="MATHEMATICS">
                        Mathematics (Matematică)
                      </SelectItem>
                      <SelectItem value="GENERAL">General STEM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="conversational">
                        Conversational
                      </SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="target-audience">
                  Target Audience (Optional)
                </Label>
                <Textarea
                  id="target-audience"
                  placeholder="e.g., 'Romanian parents with children aged 6-12' or 'STEM teachers in primary schools'"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  className="min-h-[60px] mt-2"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Options</Label>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-seo"
                      checked={includeSEO}
                      onCheckedChange={checked =>
                        setIncludeSEO(checked as boolean)
                      }
                    />
                    <Label htmlFor="include-seo" className="text-sm">
                      Include SEO optimization
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-cover"
                      checked={includeCoverImage}
                      onCheckedChange={checked =>
                        setIncludeCoverImage(checked as boolean)
                      }
                    />
                    <Label htmlFor="include-cover" className="text-sm">
                      Include cover image
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-cta"
                      checked={includeCallToAction}
                      onCheckedChange={checked =>
                        setIncludeCallToAction(checked as boolean)
                      }
                    />
                    <Label htmlFor="include-cta" className="text-sm">
                      Include call-to-action
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="save-db"
                      checked={saveToDatabase}
                      onCheckedChange={checked =>
                        setSaveToDatabase(checked as boolean)
                      }
                    />
                    <Label htmlFor="save-db" className="text-sm">
                      Save directly to database
                    </Label>
                  </div>
                </div>

                {saveToDatabase && (
                  <div className="flex items-center space-x-2 ml-6">
                    <Checkbox
                      id="auto-publish"
                      checked={autoPublish}
                      onCheckedChange={checked =>
                        setAutoPublish(checked as boolean)
                      }
                    />
                    <Label htmlFor="auto-publish" className="text-sm">
                      Auto-publish blog post
                    </Label>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Blog
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Generated Blog Preview */}
          {generatedBlog && !isGenerating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  Blog Generated Successfully!
                </h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGeneratedBlog(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Generate Another
                  </Button>
                  {!saveToDatabase && (
                    <Button
                      onClick={handleSaveToDatabase}
                      disabled={isGenerating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save to Database
                    </Button>
                  )}
                </div>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        {generatedBlog.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {generatedBlog.excerpt}
                      </CardDescription>
                    </div>
                    <Badge
                      className={getStemCategoryColor(
                        generatedBlog.stemCategory
                      )}
                    >
                      {generatedBlog.stemCategory}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Blog Stats */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>📖 {generatedBlog.readingTime} min read</span>
                    <span>📝 {generatedBlog.wordCount} words</span>
                    {generatedBlog.seoMetadata.seoScore && (
                      <span>
                        🔍 SEO Score: {generatedBlog.seoMetadata.seoScore}/100
                      </span>
                    )}
                  </div>

                  {/* SEO Metadata */}
                  {generatedBlog.seoMetadata && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">SEO Metadata:</h4>
                      <div className="text-xs space-y-1 bg-gray-50 p-3 rounded">
                        <div>
                          <strong>Title:</strong>{" "}
                          {generatedBlog.seoMetadata.metaTitle}
                        </div>
                        <div>
                          <strong>Description:</strong>{" "}
                          {generatedBlog.seoMetadata.metaDescription}
                        </div>
                        <div>
                          <strong>Keywords:</strong>{" "}
                          {generatedBlog.seoMetadata.metaKeywords
                            ?.slice(0, 5)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {generatedBlog.tags && generatedBlog.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Tags:</h4>
                      <div className="flex flex-wrap gap-1">
                        {generatedBlog.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content Preview */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      Content Preview:
                    </h4>
                    <div
                      className="text-sm text-gray-700 max-h-60 overflow-y-auto border rounded p-3 bg-gray-50"
                      dangerouslySetInnerHTML={{
                        __html:
                          generatedBlog.content.substring(0, 800) +
                          (generatedBlog.content.length > 800 ? "..." : ""),
                      }}
                    />
                  </div>

                  {/* AI Metadata */}
                  <div className="text-xs text-muted-foreground border-t pt-3">
                    <div>
                      <strong>Generated by:</strong>{" "}
                      {generatedBlog.aiMetadata.generatedBy}
                    </div>
                    <div>
                      <strong>Processing time:</strong>{" "}
                      {generatedBlog.aiMetadata.processingTime}ms
                    </div>
                    <div>
                      <strong>Original prompt:</strong>{" "}
                      {generatedBlog.aiMetadata.originalPrompt}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
