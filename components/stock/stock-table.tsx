"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Eye, EyeOff } from "lucide-react";

interface StockData {
  entitas: string;
  kode_artikel: string;
  nama_artikel: string;
  tier: number;
  tipe: string;
  gender: string;
  series: string;
  // DDD columns
  stock_awal_ddd: number;
  transaksi_in_ddd: number;
  transaksi_out_ddd: number;
  ro_ongoing_ddd: number;
  stock_akhir_ddd: number;
  // LJBB columns
  stock_awal_ljbb: number;
  transaksi_in_ljbb: number;
  transaksi_out_ljbb: number;
  ro_ongoing_ljbb: number;
  stock_akhir_ljbb: number;
  // MBB columns
  stock_awal_mbb: number;
  transaksi_in_mbb: number;
  transaksi_out_mbb: number;
  ro_ongoing_mbb: number;
  stock_akhir_mbb: number;
  // UBB columns
  stock_awal_ubb: number;
  transaksi_in_ubb: number;
  transaksi_out_ubb: number;
  ro_ongoing_ubb: number;
  stock_akhir_ubb: number;
  // Totals
  total_stock_awal: number;
  total_transaksi_in: number;
  total_transaksi_out: number;
  total_ro_ongoing: number;
  total_stock_akhir: number;
}

type ColumnGroup = "identity" | "ddd" | "ljbb" | "mbb" | "ubb" | "totals";

const COLUMN_GROUPS: Record<ColumnGroup, { label: string; color: string }> = {
  identity: { label: "Article Info", color: "from-slate-600 to-slate-800" },
  ddd: { label: "DDD Warehouse", color: "from-blue-600 to-blue-800" },
  ljbb: { label: "LJBB Warehouse", color: "from-purple-600 to-purple-800" },
  mbb: { label: "MBB Warehouse", color: "from-orange-600 to-orange-800" },
  ubb: { label: "UBB Warehouse", color: "from-teal-600 to-teal-800" },
  totals: { label: "All Warehouses", color: "from-[#002A3A] to-[#00E273]" },
};

export function StockTable() {
  const [data, setData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<ColumnGroup>>(
    new Set(["identity", "totals"])
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchStockData();
  }, []);

  async function fetchStockData() {
    try {
      const supabase = createClient();
      const { data: stockData, error } = await supabase
        .from("master_mutasi_whs")
        .select("*")
        .order("kode_artikel", { ascending: true })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      setData(stockData || []);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  }

  const toggleGroup = (group: ColumnGroup) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const getStockColor = (stock: number): string => {
    if (stock < 10) return "text-red-600 font-bold";
    if (stock < 50) return "text-yellow-600 font-semibold";
    return "text-green-600 font-medium";
  };

  const getStockBg = (stock: number): string => {
    if (stock < 10) return "bg-red-50 border-l-4 border-red-500";
    if (stock < 50) return "bg-yellow-50 border-l-4 border-yellow-500";
    return "bg-green-50 border-l-4 border-green-500";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-[#002A3A] border-t-[#00E273] rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">Loading stock data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Column Group Toggles */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-gray-700 mr-2">
            Column Groups:
          </span>
          {(Object.keys(COLUMN_GROUPS) as ColumnGroup[]).map((group) => {
            const isExpanded = expandedGroups.has(group);
            const { label, color } = COLUMN_GROUPS[group];
            return (
              <Button
                key={group}
                onClick={() => toggleGroup(group)}
                variant={isExpanded ? "default" : "outline"}
                size="sm"
                className={`gap-2 transition-all ${
                  isExpanded
                    ? `bg-gradient-to-r ${color} text-white hover:opacity-90`
                    : "hover:bg-gray-100"
                }`}
              >
                {isExpanded ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-100 hover:to-gray-50">
              {/* Identity Columns */}
              {expandedGroups.has("identity") && (
                <>
                  <TableHead className="font-black text-slate-800 sticky left-0 bg-gradient-to-r from-slate-100 to-slate-50 z-10">
                    Entitas
                  </TableHead>
                  <TableHead className="font-black text-slate-800 sticky left-20 bg-gradient-to-r from-slate-100 to-slate-50 z-10">
                    Article Code
                  </TableHead>
                  <TableHead className="font-black text-slate-800 min-w-[200px]">
                    Article Name
                  </TableHead>
                  <TableHead className="font-black text-slate-800">Tier</TableHead>
                  <TableHead className="font-black text-slate-800">Type</TableHead>
                  <TableHead className="font-black text-slate-800">Gender</TableHead>
                  <TableHead className="font-black text-slate-800">Series</TableHead>
                </>
              )}

              {/* DDD Columns */}
              {expandedGroups.has("ddd") && (
                <>
                  <TableHead className="font-black text-blue-800 bg-blue-50">
                    DDD Initial
                  </TableHead>
                  <TableHead className="font-black text-blue-800 bg-blue-50">
                    DDD In
                  </TableHead>
                  <TableHead className="font-black text-blue-800 bg-blue-50">
                    DDD Out
                  </TableHead>
                  <TableHead className="font-black text-blue-800 bg-blue-50">
                    DDD RO
                  </TableHead>
                  <TableHead className="font-black text-blue-800 bg-blue-50">
                    DDD Final
                  </TableHead>
                </>
              )}

              {/* LJBB Columns */}
              {expandedGroups.has("ljbb") && (
                <>
                  <TableHead className="font-black text-purple-800 bg-purple-50">
                    LJBB Initial
                  </TableHead>
                  <TableHead className="font-black text-purple-800 bg-purple-50">
                    LJBB In
                  </TableHead>
                  <TableHead className="font-black text-purple-800 bg-purple-50">
                    LJBB Out
                  </TableHead>
                  <TableHead className="font-black text-purple-800 bg-purple-50">
                    LJBB RO
                  </TableHead>
                  <TableHead className="font-black text-purple-800 bg-purple-50">
                    LJBB Final
                  </TableHead>
                </>
              )}

              {/* MBB Columns */}
              {expandedGroups.has("mbb") && (
                <>
                  <TableHead className="font-black text-orange-800 bg-orange-50">
                    MBB Initial
                  </TableHead>
                  <TableHead className="font-black text-orange-800 bg-orange-50">
                    MBB In
                  </TableHead>
                  <TableHead className="font-black text-orange-800 bg-orange-50">
                    MBB Out
                  </TableHead>
                  <TableHead className="font-black text-orange-800 bg-orange-50">
                    MBB RO
                  </TableHead>
                  <TableHead className="font-black text-orange-800 bg-orange-50">
                    MBB Final
                  </TableHead>
                </>
              )}

              {/* UBB Columns */}
              {expandedGroups.has("ubb") && (
                <>
                  <TableHead className="font-black text-teal-800 bg-teal-50">
                    UBB Initial
                  </TableHead>
                  <TableHead className="font-black text-teal-800 bg-teal-50">
                    UBB In
                  </TableHead>
                  <TableHead className="font-black text-teal-800 bg-teal-50">
                    UBB Out
                  </TableHead>
                  <TableHead className="font-black text-teal-800 bg-teal-50">
                    UBB RO
                  </TableHead>
                  <TableHead className="font-black text-teal-800 bg-teal-50">
                    UBB Final
                  </TableHead>
                </>
              )}

              {/* Totals Columns */}
              {expandedGroups.has("totals") && (
                <>
                  <TableHead className="font-black text-[#002A3A] bg-gradient-to-r from-[#002A3A]/10 to-[#00E273]/10">
                    Total Initial
                  </TableHead>
                  <TableHead className="font-black text-[#002A3A] bg-gradient-to-r from-[#002A3A]/10 to-[#00E273]/10">
                    Total In
                  </TableHead>
                  <TableHead className="font-black text-[#002A3A] bg-gradient-to-r from-[#002A3A]/10 to-[#00E273]/10">
                    Total Out
                  </TableHead>
                  <TableHead className="font-black text-[#002A3A] bg-gradient-to-r from-[#002A3A]/10 to-[#00E273]/10">
                    Total RO
                  </TableHead>
                  <TableHead className="font-black text-[#002A3A] bg-gradient-to-r from-[#002A3A]/10 to-[#00E273]/10">
                    Total Final
                  </TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow
                key={`${row.kode_artikel}-${idx}`}
                className={`hover:bg-gray-50 transition-colors ${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                {/* Identity Columns */}
                {expandedGroups.has("identity") && (
                  <>
                    <TableCell className="font-semibold sticky left-0 bg-white z-10">
                      {row.entitas}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-[#002A3A] sticky left-20 bg-white z-10">
                      {row.kode_artikel}
                    </TableCell>
                    <TableCell className="font-medium">{row.nama_artikel}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#002A3A] to-[#00E273] text-white font-bold text-sm">
                        {row.tier}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600">{row.tipe}</TableCell>
                    <TableCell className="text-gray-600">{row.gender}</TableCell>
                    <TableCell className="text-gray-600">{row.series}</TableCell>
                  </>
                )}

                {/* DDD Columns */}
                {expandedGroups.has("ddd") && (
                  <>
                    <TableCell className="text-right bg-blue-50/30">
                      {row.stock_awal_ddd}
                    </TableCell>
                    <TableCell className="text-right bg-blue-50/30">
                      {row.transaksi_in_ddd}
                    </TableCell>
                    <TableCell className="text-right bg-blue-50/30">
                      {row.transaksi_out_ddd}
                    </TableCell>
                    <TableCell className="text-right bg-blue-50/30">
                      {row.ro_ongoing_ddd}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${getStockBg(
                        row.stock_akhir_ddd
                      )}`}
                    >
                      <span className={getStockColor(row.stock_akhir_ddd)}>
                        {row.stock_akhir_ddd}
                      </span>
                    </TableCell>
                  </>
                )}

                {/* LJBB Columns */}
                {expandedGroups.has("ljbb") && (
                  <>
                    <TableCell className="text-right bg-purple-50/30">
                      {row.stock_awal_ljbb}
                    </TableCell>
                    <TableCell className="text-right bg-purple-50/30">
                      {row.transaksi_in_ljbb}
                    </TableCell>
                    <TableCell className="text-right bg-purple-50/30">
                      {row.transaksi_out_ljbb}
                    </TableCell>
                    <TableCell className="text-right bg-purple-50/30">
                      {row.ro_ongoing_ljbb}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${getStockBg(
                        row.stock_akhir_ljbb
                      )}`}
                    >
                      <span className={getStockColor(row.stock_akhir_ljbb)}>
                        {row.stock_akhir_ljbb}
                      </span>
                    </TableCell>
                  </>
                )}

                {/* MBB Columns */}
                {expandedGroups.has("mbb") && (
                  <>
                    <TableCell className="text-right bg-orange-50/30">
                      {row.stock_awal_mbb}
                    </TableCell>
                    <TableCell className="text-right bg-orange-50/30">
                      {row.transaksi_in_mbb}
                    </TableCell>
                    <TableCell className="text-right bg-orange-50/30">
                      {row.transaksi_out_mbb}
                    </TableCell>
                    <TableCell className="text-right bg-orange-50/30">
                      {row.ro_ongoing_mbb}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${getStockBg(
                        row.stock_akhir_mbb
                      )}`}
                    >
                      <span className={getStockColor(row.stock_akhir_mbb)}>
                        {row.stock_akhir_mbb}
                      </span>
                    </TableCell>
                  </>
                )}

                {/* UBB Columns */}
                {expandedGroups.has("ubb") && (
                  <>
                    <TableCell className="text-right bg-teal-50/30">
                      {row.stock_awal_ubb}
                    </TableCell>
                    <TableCell className="text-right bg-teal-50/30">
                      {row.transaksi_in_ubb}
                    </TableCell>
                    <TableCell className="text-right bg-teal-50/30">
                      {row.transaksi_out_ubb}
                    </TableCell>
                    <TableCell className="text-right bg-teal-50/30">
                      {row.ro_ongoing_ubb}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${getStockBg(
                        row.stock_akhir_ubb
                      )}`}
                    >
                      <span className={getStockColor(row.stock_akhir_ubb)}>
                        {row.stock_akhir_ubb}
                      </span>
                    </TableCell>
                  </>
                )}

                {/* Totals Columns */}
                {expandedGroups.has("totals") && (
                  <>
                    <TableCell className="text-right bg-gradient-to-r from-[#002A3A]/5 to-[#00E273]/5 font-semibold">
                      {row.total_stock_awal}
                    </TableCell>
                    <TableCell className="text-right bg-gradient-to-r from-[#002A3A]/5 to-[#00E273]/5 font-semibold">
                      {row.total_transaksi_in}
                    </TableCell>
                    <TableCell className="text-right bg-gradient-to-r from-[#002A3A]/5 to-[#00E273]/5 font-semibold">
                      {row.total_transaksi_out}
                    </TableCell>
                    <TableCell className="text-right bg-gradient-to-r from-[#002A3A]/5 to-[#00E273]/5 font-semibold">
                      {row.total_ro_ongoing}
                    </TableCell>
                    <TableCell
                      className={`text-right font-black text-lg ${getStockBg(
                        row.total_stock_akhir
                      )}`}
                    >
                      <span className={getStockColor(row.total_stock_akhir)}>
                        {row.total_stock_akhir}
                      </span>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 font-medium">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, data.length)} of {data.length}{" "}
            items
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="font-semibold"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={data.length < itemsPerPage}
              className="font-semibold"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
