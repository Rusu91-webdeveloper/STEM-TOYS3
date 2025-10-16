"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { Database, Key, Link2 } from "lucide-react";
import { SchemaField } from "@/lib/database/schema-analyzer";

interface TableNodeData {
  label: string;
  fields: SchemaField[];
  moreFieldsCount: number;
  totalFields: number;
  domain: string;
  color: string;
  indexes: string[];
  relations: any[];
  allFields: SchemaField[];
}

export function TableNode({ data, selected }: NodeProps<TableNodeData>) {
  const { label, fields, moreFieldsCount, domain, color, indexes, relations } =
    data;

  return (
    <div
      className={`
        bg-white border-2 rounded-lg shadow-lg overflow-hidden
        transition-all duration-200 hover:shadow-xl
        ${selected ? "ring-4 ring-blue-400 ring-opacity-50" : ""}
      `}
      style={{
        borderColor: color,
        width: 280,
      }}
    >
      {/* Handle for connections */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      {/* Header */}
      <div
        className="px-4 py-3 text-white font-semibold flex items-center gap-2"
        style={{ backgroundColor: color }}
      >
        <Database className="w-4 h-4" />
        <span className="flex-1 truncate">{label}</span>
        {relations.length > 0 && (
          <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded">
            {relations.length}
          </span>
        )}
      </div>

      {/* Domain Badge */}
      <div className="px-4 py-1 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          {domain}
        </span>
      </div>

      {/* Fields */}
      <div className="px-4 py-3 space-y-1.5 max-h-36 overflow-y-auto">
        {fields.map((field, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-sm group hover:bg-gray-50 px-1 py-0.5 rounded transition-colors"
          >
            {field.name === "id" && (
              <Key className="w-3 h-3 text-amber-500 flex-shrink-0" />
            )}
            {field.isRelation && (
              <Link2 className="w-3 h-3 text-blue-500 flex-shrink-0" />
            )}
            <span
              className={`flex-1 truncate ${
                field.name === "id"
                  ? "font-semibold text-gray-900"
                  : "text-gray-700"
              }`}
            >
              {field.name}
            </span>
            <span className="text-xs text-gray-500 font-mono">
              {field.type}
              {field.isArray && "[]"}
              {!field.isRequired && "?"}
            </span>
          </div>
        ))}

        {moreFieldsCount > 0 && (
          <div className="text-xs text-gray-500 italic px-1 py-1">
            + {moreFieldsCount} more field{moreFieldsCount !== 1 ? "s" : ""}...
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
        <span>{data.totalFields} fields</span>
        {indexes.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            {indexes.length} index{indexes.length !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
