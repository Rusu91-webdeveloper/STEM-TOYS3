"use client";

import { useState } from "react";
import { Edit2, Check, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPriceWithCurrency } from "@/lib/currency-converter";
import { cn } from "@/lib/utils";

interface ProductRow {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  sku?: string;
  category?: string;
  images?: string;
  [key: string]: any;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface InlineTableEditorProps {
  products: ProductRow[];
  validationErrors: ValidationError[];
  onUpdateProduct: (index: number, field: string, value: any) => void;
}

export function InlineTableEditor({
  products,
  validationErrors,
  onUpdateProduct,
}: InlineTableEditorProps) {
  const [editingCell, setEditingCell] = useState<{
    row: number;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const getErrorsForRow = (rowIndex: number) => {
    return validationErrors.filter(error => error.row === rowIndex + 2);
  };

  const getErrorForCell = (rowIndex: number, field: string) => {
    return validationErrors.find(
      error => error.row === rowIndex + 2 && error.field === field
    );
  };

  const startEditing = (rowIndex: number, field: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, field });
    setEditValue(String(currentValue || ""));
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const saveEditing = () => {
    if (!editingCell) return;

    const { row, field } = editingCell;
    let parsedValue: any = editValue;

    // Parse numbers
    if (["price", "stockQuantity", "weight", "reorderPoint"].includes(field)) {
      parsedValue = parseFloat(editValue) || 0;
    }

    onUpdateProduct(row, field, parsedValue);
    setEditingCell(null);
    setEditValue("");
  };

  const renderCell = (
    product: ProductRow,
    rowIndex: number,
    field: string,
    value: any
  ) => {
    const error = getErrorForCell(rowIndex, field);
    const isEditing =
      editingCell?.row === rowIndex && editingCell?.field === field;

    if (isEditing) {
      const isLongText = field === "description";
      return (
        <div className="flex items-center gap-1 min-w-[200px]">
          {isLongText ? (
            <Textarea
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Escape") cancelEditing();
              }}
              className="min-h-[60px]"
              autoFocus
            />
          ) : (
            <Input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") saveEditing();
                if (e.key === "Escape") cancelEditing();
              }}
              className="h-8"
              autoFocus
            />
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-green-600"
            onClick={saveEditing}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-600"
            onClick={cancelEditing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "group flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors",
          error && "bg-red-50 dark:bg-red-950/20 border border-red-200"
        )}
        onClick={() => startEditing(rowIndex, field, value)}
      >
        <span
          className={cn(
            "flex-1 truncate text-sm",
            error && "text-red-600 font-medium"
          )}
        >
          {field === "price"
            ? formatPriceWithCurrency(value || 0, "RON")
            : String(value || "-")}
        </span>
        {error ? (
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
        ) : (
          <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead className="min-w-[180px]">
                  Name <span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="min-w-[250px]">
                  Description <span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="min-w-[100px]">
                  Price <span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="min-w-[100px]">
                  Stock <span className="text-red-500">*</span>
                </TableHead>
                <TableHead className="min-w-[120px]">SKU</TableHead>
                <TableHead className="min-w-[120px]">Category</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => {
                const errors = getErrorsForRow(index);
                const hasErrors = errors.length > 0;

                return (
                  <TableRow
                    key={index}
                    className={cn(
                      hasErrors && "bg-red-50/30 dark:bg-red-950/10"
                    )}
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      {renderCell(product, index, "name", product.name)}
                    </TableCell>
                    <TableCell>
                      {renderCell(
                        product,
                        index,
                        "description",
                        product.description
                      )}
                    </TableCell>
                    <TableCell>
                      {renderCell(product, index, "price", product.price)}
                    </TableCell>
                    <TableCell>
                      {renderCell(
                        product,
                        index,
                        "stockQuantity",
                        product.stockQuantity
                      )}
                    </TableCell>
                    <TableCell>
                      {renderCell(product, index, "sku", product.sku)}
                    </TableCell>
                    <TableCell>
                      {renderCell(product, index, "category", product.category)}
                    </TableCell>
                    <TableCell>
                      {hasErrors ? (
                        <Badge
                          variant="destructive"
                          className="text-xs whitespace-nowrap"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.length} error{errors.length > 1 ? "s" : ""}
                        </Badge>
                      ) : (
                        <Badge
                          variant="default"
                          className="text-xs bg-green-600 whitespace-nowrap"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Valid
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Error Details */}
      {validationErrors.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            Validation Errors ({validationErrors.length})
          </h4>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {validationErrors.map((error, idx) => (
              <div
                key={idx}
                className="text-xs p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 flex items-start gap-2"
              >
                <span className="font-mono font-semibold text-red-700">
                  Row {error.row}:
                </span>
                <span className="text-muted-foreground">{error.field} -</span>
                <span className="text-red-600">{error.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
