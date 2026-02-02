"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SortDirection = "asc" | "desc" | null;

interface SortState {
  key: string | null;
  direction: SortDirection;
}

interface ColumnDef {
  key: string;
  label: string;
  align?: "left" | "right";
  width?: string;
}

interface TransactionTableProps {
  data: Record<string, unknown>[];
  columns: ColumnDef[];
  entityName: string;
}

const defaultColumnWidths: Record<string, string> = {
  No: "60px",
  Tanggal: "100px",
  Artikel: "120px",
  "Nama Barang": "200px",
  "Transaksi in": "100px",
  "transaksi out": "100px",
  "Gudang Asal": "120px",
  "Gudang Terima": "120px",
  DNPB: "180px",
  "No. SO": "120px",
  "BST/DN": "100px",
  "NO PO": "150px",
  "NO LPB": "150px",
  Remaks: "150px",
};

export function TransactionTable({
  data,
  columns,
  entityName,
}: TransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sort, setSort] = useState<SortState>({ key: null, direction: null });
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const isSyncing = useRef(false);
  const [tableWidth, setTableWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (tableRef.current) {
        setTableWidth(tableRef.current.scrollWidth);
      }
    };
    
    updateWidth();
    
    const resizeObserver = new ResizeObserver(updateWidth);
    if (tableRef.current) {
      resizeObserver.observe(tableRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [data, columns]);

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

  const handleTopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncing.current = false; });
  };

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    if (topScrollRef.current) {
      topScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    requestAnimationFrame(() => { isSyncing.current = false; });
  };

  const getColumnWidth = (col: ColumnDef) => {
    return col.width || defaultColumnWidths[col.key] || "150px";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transaksi {entityName}</h1>
        <p className="text-sm text-muted-foreground">
          {sortedData.length} records
        </p>
      </div>

      <div className="border rounded-md">
        <div
          ref={topScrollRef}
          onScroll={handleTopScroll}
          style={{ 
            overflowX: "auto", 
            overflowY: "hidden",
            height: "16px",
            backgroundColor: "hsl(var(--muted))",
            borderBottom: "1px solid hsl(var(--border))"
          }}
        >
          <div style={{ width: tableWidth, height: "1px", minWidth: "100%" }} />
        </div>

        <div
          ref={tableScrollRef}
          onScroll={handleTableScroll}
          style={{ 
            overflow: "auto",
            maxHeight: "calc(100vh - 300px)"
          }}
        >
          <Table ref={tableRef}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((col, colIndex) => (
                  <TableHead
                    key={col.key}
                    style={{ 
                      width: getColumnWidth(col), 
                      minWidth: getColumnWidth(col),
                      position: "sticky",
                      top: 0,
                      left: colIndex === 0 ? 0 : undefined,
                      zIndex: colIndex === 0 ? 30 : 20,
                      backgroundColor: "hsl(var(--muted))",
                    }}
                    className={`cursor-pointer hover:bg-muted/80 border-r border-border last:border-r-0 ${
                      col.align === "right" ? "text-right" : ""
                    }`}
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="break-words leading-tight">{col.label}</span>
                      {sort.key === col.key &&
                        (sort.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4 shrink-0" />
                        ) : sort.direction === "desc" ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : null)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/50">
                    {columns.map((col, colIndex) => (
                      <TableCell
                        key={col.key}
                        style={{ 
                          width: getColumnWidth(col), 
                          minWidth: getColumnWidth(col),
                          position: colIndex === 0 ? "sticky" : undefined,
                          left: colIndex === 0 ? 0 : undefined,
                          zIndex: 10,
                          backgroundColor: "hsl(var(--background))",
                        }}
                        className={`border-r border-border last:border-r-0 align-top ${
                          col.align === "right" ? "text-right" : ""
                        }`}
                      >
                        <span className="break-words whitespace-normal leading-relaxed">
                          {row[col.key] !== null && row[col.key] !== undefined
                            ? String(row[col.key])
                            : "-"}
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
