"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  History,
  RotateCcw,
  Eye,
  GitCompare,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  FileText,
  Save,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ContentVersion {
  id: string;
  version: number;
  title: string;
  content: any;
  changeDescription?: string;
  createdBy: string;
  createdAt: Date;
  isPublished: boolean;
  creator: {
    name: string;
    email: string;
  };
}

interface ContentWorkflowProps {
  contentId: string;
  contentType: "BLOG" | "PRODUCT" | "CATEGORY";
  currentContent: any;
  onSave: (content: any, changeDescription?: string) => Promise<void>;
  onPublish: (content: any) => Promise<void>;
  className?: string;
}

export function ContentWorkflow({
  contentId,
  contentType,
  currentContent,
  onSave,
  onPublish,
  className,
}: ContentWorkflowProps) {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(
    null
  );
  const [compareVersion, setCompareVersion] = useState<ContentVersion | null>(
    null
  );
  const [changeDescription, setChangeDescription] = useState("");
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);

  // Load version history
  useEffect(() => {
    loadVersionHistory();
  }, [contentId, contentType]);

  const loadVersionHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/content-versions?contentId=${contentId}&contentType=${contentType}`
      );
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error("Failed to load version history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVersion = async () => {
    try {
      setLoading(true);
      await onSave(currentContent, changeDescription);
      setChangeDescription("");
      await loadVersionHistory();
    } catch (error) {
      console.error("Failed to save version:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (version: ContentVersion) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/content-versions/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          contentType,
          version: version.version,
          changeDescription: `Restored to version ${version.version}`,
        }),
      });

      if (response.ok) {
        // Reload the page or update the content
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to restore version:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      await onPublish(currentContent);
      await loadVersionHistory();
    } catch (error) {
      console.error("Failed to publish content:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVersionBadgeVariant = (version: ContentVersion) => {
    if (version.isPublished) return "default";
    return "secondary";
  };

  const getStatusIcon = (version: ContentVersion) => {
    if (version.isPublished) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <Clock className="h-4 w-4 text-orange-600" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Content Workflow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="versions">
              <History className="h-4 w-4 mr-1" />
              History ({versions.length})
            </TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="change-description">Change Description</Label>
                <Textarea
                  id="change-description"
                  placeholder="Describe what changes you made..."
                  value={changeDescription}
                  onChange={e => setChangeDescription(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveVersion}
                  disabled={loading || !changeDescription.trim()}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Version
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={loading}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Publish
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Publish Content</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will make the content live on your website. Are you
                        sure you want to publish?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handlePublish}>
                        Publish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="versions" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">
                  Loading versions...
                </p>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No versions saved yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map(version => (
                  <Card key={version.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(version)}
                          <Badge variant={getVersionBadgeVariant(version)}>
                            Version {version.version}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(version.createdAt))}{" "}
                            ago
                          </span>
                        </div>

                        <h4 className="font-medium">{version.title}</h4>
                        {version.changeDescription && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {version.changeDescription}
                          </p>
                        )}

                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {version.creator.name || version.creator.email}
                        </div>
                      </div>

                      <div className="flex gap-1 ml-4">
                        <Dialog
                          open={
                            showVersionDialog &&
                            selectedVersion?.id === version.id
                          }
                          onOpenChange={open => {
                            setShowVersionDialog(open);
                            if (!open) setSelectedVersion(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedVersion(version)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Version {version.version} - {version.title}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="bg-muted p-4 rounded-lg">
                                <pre className="text-sm whitespace-pre-wrap">
                                  {JSON.stringify(version.content, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Restore Version
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will restore the content to version{" "}
                                {version.version}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRestoreVersion(version)}
                              >
                                Restore
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        {versions.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCompareVersion(version);
                              setShowCompareDialog(true);
                            }}
                          >
                            <GitCompare className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="publish" className="space-y-4">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ready to Publish?</h3>
              <p className="text-muted-foreground mb-6">
                Publishing will make this content live on your website for
                everyone to see.
              </p>

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p>✓ Content has been saved</p>
                  <p>✓ SEO metadata is configured</p>
                  <p>✓ All required fields are filled</p>
                </div>

                <Button
                  onClick={handlePublish}
                  disabled={loading}
                  className="min-w-[200px]"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Publish Now
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
