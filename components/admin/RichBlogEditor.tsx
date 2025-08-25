"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  SeparatorHorizontal,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EnhancedMarkdownRenderer from "@/components/blog/EnhancedMarkdownRenderer";

interface RichBlogEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichBlogEditor({
  value,
  onChange,
  placeholder,
}: RichBlogEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (
    text: string,
    before: string = "",
    after: string = ""
  ) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);
    onChange(newText);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newText = value.substring(0, start) + text + value.substring(start);
    onChange(newText);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const toolbarButtons = [
    {
      icon: <Heading1 className="h-4 w-4" />,
      label: "Heading 1",
      action: () => insertAtCursor("\n# "),
      shortcut: "Ctrl+1",
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      label: "Heading 2",
      action: () => insertAtCursor("\n## "),
      shortcut: "Ctrl+2",
    },
    {
      icon: <Heading3 className="h-4 w-4" />,
      label: "Heading 3",
      action: () => insertAtCursor("\n### "),
      shortcut: "Ctrl+3",
    },
    { separator: true },
    {
      icon: <Bold className="h-4 w-4" />,
      label: "Bold",
      action: () => insertText("**", "**", "**"),
      shortcut: "Ctrl+B",
    },
    {
      icon: <Italic className="h-4 w-4" />,
      label: "Italic",
      action: () => insertText("*", "*", "*"),
      shortcut: "Ctrl+I",
    },
    { separator: true },
    {
      icon: <List className="h-4 w-4" />,
      label: "Bullet List",
      action: () => insertAtCursor("\n- "),
      shortcut: "Ctrl+L",
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      label: "Numbered List",
      action: () => insertAtCursor("\n1. "),
      shortcut: "Ctrl+Shift+L",
    },
    { separator: true },
    {
      icon: <Quote className="h-4 w-4" />,
      label: "Quote",
      action: () => insertText("\n> ", "", ""),
      shortcut: "Ctrl+Q",
    },
    {
      icon: <Code className="h-4 w-4" />,
      label: "Code",
      action: () => insertText("`", "`", "`"),
      shortcut: "Ctrl+`",
    },
    {
      icon: <Link className="h-4 w-4" />,
      label: "Link",
      action: () => insertText("[", "](url)", ""),
      shortcut: "Ctrl+K",
    },
    {
      icon: <ImageIcon className="h-4 w-4" />,
      label: "Image",
      action: () => insertText("![alt text](", ")", ""),
      shortcut: "Ctrl+Shift+I",
    },
    { separator: true },
    {
      icon: <SeparatorHorizontal className="h-4 w-4" />,
      label: "Horizontal Rule",
      action: () => insertAtCursor("\n---\n"),
      shortcut: "Ctrl+H",
    },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!textareaRef.current || !textareaRef.current.matches(":focus"))
        return;

      const isCtrl = e.ctrlKey || e.metaKey;
      if (!isCtrl) return;

      e.preventDefault();

      switch (e.key) {
        case "1":
          insertAtCursor("\n# ");
          break;
        case "2":
          insertAtCursor("\n## ");
          break;
        case "3":
          insertAtCursor("\n### ");
          break;
        case "b":
          insertText("**", "**", "**");
          break;
        case "i":
          insertText("*", "*", "*");
          break;
        case "l":
          if (e.shiftKey) {
            insertAtCursor("\n1. ");
          } else {
            insertAtCursor("\n- ");
          }
          break;
        case "q":
          insertText("\n> ", "", "");
          break;
        case "`":
          insertText("`", "`", "`");
          break;
        case "k":
          insertText("[", "](url)", "");
          break;
        case "h":
          insertAtCursor("\n---\n");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [value]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Blog Content Editor</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {value.length} characters
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-2"
            >
              {isPreview ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {isPreview ? "Edit" : "Preview"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={isPreview ? "preview" : "edit"}
          onValueChange={v => setIsPreview(v === "preview")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-3 bg-gray-50 rounded-lg border">
              {toolbarButtons.map((button, index) =>
                button.separator ? (
                  <div key={index} className="w-px h-6 bg-gray-300 mx-2" />
                ) : (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={button.action}
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                    title={`${button.label} (${button.shortcut})`}
                  >
                    {button.icon}
                  </Button>
                )
              )}
            </div>

            {/* Editor */}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={
                  placeholder ||
                  "Write your blog content here...\n\nUse the toolbar above or keyboard shortcuts to format your text.\n\n# Heading 1\n## Heading 2\n### Heading 3\n\n**Bold text**\n*Italic text*\n\n- Bullet list\n- Another item\n\n1. Numbered list\n2. Another item\n\n> This is a quote\n\n`Inline code`\n\n```\nCode block\n```\n\n[Link text](url)\n\n![Alt text](image-url)\n\n---\n\nHorizontal rule"
                }
                className="min-h-[500px] font-mono text-sm leading-relaxed resize-none"
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                }}
              />
            </div>

            {/* Word count and reading time */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span>{value.split(/\s+/).filter(Boolean).length} words</span>
                <span>
                  {Math.ceil(value.split(/\s+/).filter(Boolean).length / 200)}{" "}
                  min read
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Lines: {value.split("\n").length}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="bg-white rounded-lg border p-6 min-h-[500px] overflow-y-auto">
              {value ? (
                <EnhancedMarkdownRenderer content={value} />
              ) : (
                <div className="text-gray-500 text-center py-12">
                  <p>No content to preview</p>
                  <p className="text-sm">
                    Start writing in the Edit tab to see a preview here
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
