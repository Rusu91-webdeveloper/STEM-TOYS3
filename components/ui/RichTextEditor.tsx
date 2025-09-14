"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useRef, useState, useEffect } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent } from "./card";
import {
  Type,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Image,
  Code,
  Eye,
  EyeOff,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Hash,
  Minus,
  Zap,
  Lightbulb,
} from "lucide-react";
import { VariableSuggestionsPanel } from "./VariableSuggestionsPanel";
import { EmailVariableSuggestions } from "@/lib/email-variable-suggestions";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  showVariableHelper?: boolean;
  variables?: string[];
  onVariableClick?: (variable: string) => void;
  className?: string;
  // Smart variable suggestions props
  templateCategory?: string;
  subject?: string;
  enableSmartSuggestions?: boolean;
}

const commonVariables = [
  "{{user.name}}",
  "{{user.email}}",
  "{{user.firstName}}",
  "{{user.lastName}}",
  "{{order.number}}",
  "{{order.total}}",
  "{{order.items}}",
  "{{order.date}}",
  "{{product.name}}",
  "{{product.price}}",
  "{{product.description}}",
  "{{site.name}}",
  "{{site.url}}",
  "{{site.logo}}",
  "{{current.date}}",
  "{{current.year}}",
  "{{unsubscribe.link}}",
  "{{unsubscribe.text}}",
  "{{image.0}}",
  "{{image.1}}",
  "{{image.2}}",
  "{{image.3}}",
  "{{image.4}}",
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter your email content...",
  height = 400,
  showVariableHelper = true,
  variables = commonVariables,
  onVariableClick,
  className = "",
  templateCategory = "",
  subject = "",
  enableSmartSuggestions = true,
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);
  const [showVariables, setShowVariables] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Check if we have a valid TinyMCE API key
  const hasApiKey =
    process.env.NEXT_PUBLIC_TINYMCE_API_KEY &&
    process.env.NEXT_PUBLIC_TINYMCE_API_KEY !== "no-api-key" &&
    process.env.NEXT_PUBLIC_TINYMCE_API_KEY !==
      "fwejwtkwa87t7ufsvcovh39i7lh508a68peecskrkuycoc9l"; // Skip the invalid key

  // Extract existing variables from content
  const extractExistingVariables = (content: string): string[] => {
    const variableRegex = /\{\{[^}]+\}\}/g;
    const matches = content.match(variableRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  };

  const existingVariables = extractExistingVariables(value);

  // Listen for custom image insertion events
  useEffect(() => {
    const handleInsertImage = (event: CustomEvent) => {
      const { image, imageHtml } = event.detail;
      if (editorRef.current) {
        editorRef.current.insertContent(imageHtml);
      }
    };

    window.addEventListener(
      "insertEmailImage",
      handleInsertImage as EventListener
    );

    return () => {
      window.removeEventListener(
        "insertEmailImage",
        handleInsertImage as EventListener
      );
    };
  }, []);

  const handleVariableClick = (variable: string) => {
    if (onVariableClick) {
      onVariableClick(variable);
    } else {
      // Default behavior: insert variable at cursor position
      if (editorRef.current) {
        editorRef.current.insertContent(variable);
      }
    }
  };

  const insertVariable = (variable: string) => {
    if (editorRef.current) {
      editorRef.current.insertContent(
        `<span class="variable" style="background-color: #e3f2fd; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: #1976d2;">${variable}</span>`
      );
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
    if (editorRef.current) {
      if (showPreview) {
        editorRef.current.mode.set("design");
      } else {
        editorRef.current.mode.set("preview");
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Variable Helper Panel */}
      {showVariableHelper && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                Email Variables
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVariables(!showVariables)}
                className="text-xs"
              >
                {showVariables ? (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Show
                  </>
                )}
              </Button>
            </div>

            {showVariables && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {variables.map(variable => (
                  <Button
                    key={variable}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable)}
                    className="text-xs justify-start h-8 px-2"
                  >
                    <Code className="h-3 w-3 mr-1" />
                    {variable}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Editor Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 p-2 rounded-t-lg border">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            <Type className="h-3 w-3 mr-1" />
            Rich Text
          </Badge>
          <div className="text-xs text-gray-500">{value.length} characters</div>
          {existingVariables.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <Code className="h-3 w-3 mr-1" />
              {existingVariables.length} variables
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {enableSmartSuggestions && (
            <VariableSuggestionsPanel
              templateCategory={templateCategory}
              content={value}
              subject={subject}
              existingVariables={existingVariables}
              onVariableSelect={handleVariableClick}
              className="relative"
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePreview}
            className="text-xs"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Edit
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor - TinyMCE or Fallback */}
      <div className="border border-t-0 rounded-b-lg overflow-hidden">
        {hasApiKey ? (
          <Editor
            onInit={(evt, editor) => (editorRef.current = editor)}
            value={value}
            onEditorChange={onChange}
            apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
            init={{
              height: height,
              menubar: false,
              // Disable problematic features when no API key
              promotion: false,
              branding: false,
              // Add error handling for license validation
              license_key: "gpl", // Use GPL license to avoid validation issues
              // Use only core free plugins that are guaranteed to work
              plugins: [
                "advlist",
                "autolink",
                "lists",
                "link",
                "image",
                "charmap",
                "preview",
                "anchor",
                "searchreplace",
                "visualblocks",
                "code",
                "fullscreen",
                "insertdatetime",
                "media",
                "table",
                "help",
                "wordcount",
                "emoticons",
                "nonbreaking",
                "pagebreak",
              ],
              toolbar: [
                "undo redo | formatselect | bold italic underline strikethrough |",
                "alignleft aligncenter alignright alignjustify |",
                "bullist numlist outdent indent | removeformat |",
                "link image media | code preview |",
                "fontsize | fontfamily | blockquote | subscript superscript |",
                "emoticons | fullscreen help",
              ],
              content_style: `
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                  font-size: 14px; 
                  line-height: 1.6;
                  color: #333;
                  margin: 16px;
                }
                .variable {
                  background-color: #e3f2fd !important;
                  padding: 2px 6px !important;
                  border-radius: 4px !important;
                  font-weight: 600 !important;
                  color: #1976d2 !important;
                  border: 1px solid #bbdefb !important;
                }
                h1, h2, h3, h4, h5, h6 {
                  color: #1f2937;
                  margin-top: 0;
                  margin-bottom: 16px;
                }
                p {
                  margin-bottom: 16px;
                }
                a {
                  color: #3b82f6;
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
                .email-container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: #ffffff;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .email-header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 32px 24px;
                  text-align: center;
                }
                .email-body {
                  padding: 32px 24px;
                }
                .email-footer {
                  background: #f9fafb;
                  padding: 24px;
                  text-align: center;
                  color: #6b7280;
                  font-size: 12px;
                }
              `,
              placeholder: placeholder,
              branding: false,
              promotion: false,
              statusbar: false,
              resize: false,
              elementpath: false,
              setup: editor => {
                // Add custom button for variables
                editor.ui.registry.addButton("variables", {
                  text: "Variables",
                  icon: "code",
                  onAction: () => {
                    setShowVariables(!showVariables);
                  },
                });

                // Add custom button for email preview
                editor.ui.registry.addButton("emailpreview", {
                  text: "Email Preview",
                  icon: "preview",
                  onAction: () => {
                    // This will be handled by the preview toggle
                    togglePreview();
                  },
                });
              },
              file_picker_callback: (callback, value, meta) => {
                // Handle file picker for images
                if (meta.filetype === "image") {
                  const input = document.createElement("input");
                  input.setAttribute("type", "file");
                  input.setAttribute("accept", "image/*");
                  input.click();

                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        callback(reader.result as string, {
                          alt: file.name,
                          title: file.name,
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                }
              },
            }}
          />
        ) : (
          // Enhanced fallback editor
          <div className="relative bg-white">
            <div className="flex items-center justify-between p-2 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Basic Editor
                </Badge>
                <span className="text-xs text-gray-500">
                  TinyMCE not available
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const text = value;
                    onChange(text.replace(/\n/g, "<br>"));
                  }}
                  className="text-xs h-6 px-2"
                >
                  Add Line Breaks
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const text = value;
                    onChange(
                      `<p>${text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`
                    );
                  }}
                  className="text-xs h-6 px-2"
                >
                  Format HTML
                </Button>
              </div>
            </div>
            <textarea
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full p-4 border-0 resize-none focus:outline-none focus:ring-0"
              style={{
                height: `${height - 40}px`,
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
              }}
            />
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>
          💡 <strong>Tips:</strong>
        </p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Use variables to personalize your emails</li>
          <li>Click "Preview" to see how your email will look</li>
          {hasApiKey ? (
            <>
              <li>Images will be automatically optimized for email clients</li>
              <li>Use the "Email Preview" mode to see the full email layout</li>
            </>
          ) : (
            <li>
              <strong>Get a free TinyMCE API key</strong> from{" "}
              <a
                href="https://www.tiny.cloud/auth/signup/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                tiny.cloud
              </a>{" "}
              for rich text editing features
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
