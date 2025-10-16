"use client";

import { X, Database, Key, Link2, List, Layers } from "lucide-react";
import { SchemaModel } from "@/lib/database/schema-analyzer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface TableDetailsSidebarProps {
  table: SchemaModel | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TableDetailsSidebar({
  table,
  isOpen,
  onClose,
}: TableDetailsSidebarProps) {
  if (!table || !isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{table.name}</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                <Badge variant="outline" className="text-xs">
                  {table.domain.toUpperCase()}
                </Badge>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-900">
                  {table.fields.length}
                </div>
                <div className="text-xs text-blue-700 mt-1">Total Fields</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-900">
                  {table.indexes.length}
                </div>
                <div className="text-xs text-green-700 mt-1">Indexes</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-900">
                  {table.relations.length}
                </div>
                <div className="text-xs text-purple-700 mt-1">Relations</div>
              </div>
            </div>

            {/* Fields Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <List className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Fields</h3>
              </div>
              <div className="space-y-2">
                {table.fields.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="mt-1">
                      {field.name === "id" && (
                        <Key className="w-4 h-4 text-amber-500" />
                      )}
                      {field.isRelation && field.name !== "id" && (
                        <Link2 className="w-4 h-4 text-blue-500" />
                      )}
                      {!field.isRelation && field.name !== "id" && (
                        <div className="w-4 h-4 rounded-full bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {field.name}
                        </span>
                        <code className="text-sm px-2 py-0.5 bg-gray-200 text-gray-800 rounded font-mono">
                          {field.type}
                          {field.isArray && "[]"}
                          {!field.isRequired && "?"}
                        </code>
                        {field.isUnique && (
                          <Badge variant="secondary" className="text-xs">
                            UNIQUE
                          </Badge>
                        )}
                        {field.isRelation && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-50"
                          >
                            → {field.relationTo}
                          </Badge>
                        )}
                      </div>
                      {field.defaultValue && (
                        <p className="text-xs text-gray-600 mt-1">
                          Default:{" "}
                          <code className="text-gray-800">
                            {field.defaultValue}
                          </code>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Relations Section */}
            {table.relations.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Link2 className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Relations
                  </h3>
                </div>
                <div className="space-y-2">
                  {table.relations.map((relation, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">
                          {relation.fieldName}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="font-medium text-blue-600">
                          {relation.to}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {relation.type.toUpperCase().replace(/-/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Indexes Section */}
            {table.indexes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-5 h-5 text-gray-700" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Performance Indexes
                  </h3>
                </div>
                <div className="space-y-2">
                  {table.indexes.map((index, i) => (
                    <div
                      key={i}
                      className="p-3 bg-green-50 rounded-lg border border-green-200 font-mono text-sm text-gray-700"
                    >
                      {index}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
