"use client";

import { useMemo, useState } from "react";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortDirection = "asc" | "desc" | null;

interface SortState {
  key: string | null;
  direction: SortDirection;
}

interface ColumnDef {
  key: string;
  label: string;
  align?: "left" | "right";
}

interface TransactionTableProps {
  data: Record<string, unknown>[];
  columns: ColumnDef[];
  entityName: string;
}

interface ExpandedCell {
  rowIndex: number;
  colKey: string;
}

export function TransactionTable({
  data,
  columns,
  entityName,
}: TransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sort, setSort] = useState<SortState>({ key: null, direction: null });
  const [expandedCell, setExpandedCell] = useState<ExpandedCell | null>(null);

  const handleSort = (key: string) => {
    setSort((prev) => ({
      key,
      direction:
        prev.key === key
          ? prev.direction === "asc"
            ? "desc"
            : prev.direction === "desc"
              ? null
              : "asc"
          : "asc",
    }));
  };

  const handleCellClick = (rowIndex: number, colKey: string) => {
    setExpandedCell(
      expandedCell?.rowIndex === rowIndex && expandedCell?.colKey === colKey
        ? null
        : { rowIndex, colKey }
    );
  };

  const sortedData = useMemo(() => {
    if (!sort.key || !sort.direction) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sort.key!];
      const bVal = b[sort.key!];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const aNum = Number(aVal);
      const bNum = Number(bVal);
      const bothAreNumbers = !isNaN(aNum) && !isNaN(bNum) && aVal !== "" && bVal !== "";

      if (bothAreNumbers) {
        if (sort.direction === "asc") {
          return aNum - bNum;
        }
        return bNum - aNum;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (sort.direction === "asc") {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [data, sort]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transaksi {entityName}</h1>
        <p className="text-sm text-muted-foreground">
          {sortedData.length} records
        </p>
      </div>

      <div className="border rounded-md w-full">
        <div style={{ maxHeight: "calc(100vh - 280px)" }} className="overflow-y-auto">
          <table className="w-full caption-bottom text-sm border-collapse">
            <thead className="[&_tr]:border-b">
              <tr className="hover:bg-transparent border-b transition-colors">
                {columns.map((col, colIndex) => (
                  <th
                    key={col.key}
                    style={{ 
                      position: "sticky",
                      top: 0,
                      left: colIndex === 0 ? 0 : undefined,
                      zIndex: colIndex === 0 ? 30 : 20,
                      backgroundColor: "hsl(var(--muted))",
                    }}
                    className={`text-foreground h-10 px-2 text-left align-middle font-medium cursor-pointer hover:bg-muted/80 border-r border-border last:border-r-0 ${
                      col.align === "right" ? "text-right" : ""
                    }`}
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="leading-tight truncate max-w-[150px]">{col.label}</span>
                      {sort.key === col.key &&
                        (sort.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4 shrink-0" />
                        ) : sort.direction === "desc" ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : null)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-2 align-middle h-24 text-center border-b"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/50 border-b transition-colors">
                    {columns.map((col, colIndex) => {
                      const cellValue = row[col.key] !== null && row[col.key] !== undefined
                        ? String(row[col.key])
                        : "-";
                      const isExpanded = expandedCell?.rowIndex === idx && expandedCell?.colKey === col.key;
                      
                      return (
                        <td
                          key={col.key}
                          style={{ 
                            position: colIndex === 0 ? "sticky" : undefined,
                            left: colIndex === 0 ? 0 : undefined,
                            zIndex: colIndex === 0 ? 25 : undefined,
                            backgroundColor: colIndex === 0 ? "hsl(var(--background))" : undefined,
                          }}
                          className={`p-2 align-middle border-r border-border last:border-r-0 cursor-pointer ${
                            col.align === "right" ? "text-right" : ""
                          }`}
                          onClick={() => handleCellClick(idx, col.key)}
                          title={isExpanded ? "Click to collapse" : "Click to expand"}
                        >
                          <span className={`leading-relaxed ${isExpanded ? "whitespace-normal break-all" : "truncate block max-w-[200px]"}`}>
                            {cellValue}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedData.length)} of{" "}
            {sortedData.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
