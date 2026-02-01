"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Calendar, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";

type ValidWarehouse = "ddd" | "ljbb" | "mbb";

interface Transaction {
  id: number;
  No: string;
  Tanggal: string;
  Artikel: string;
  "Nama Barang": string;
  "Transaksi in": number | null;
  "transaksi out": number | null;
  "Gudang Asal": string;
  "Gudang Terima": string;
  DNPB: string;
  "No. SO": string;
  "BST/DN": string;
  "NO PO": string;
  "NO LPB": string;
  Remaks: string;
}

interface TransactionTableProps {
  warehouse: ValidWarehouse;
}

const ITEMS_PER_PAGE = 50;

export function TransactionTable({ warehouse }: TransactionTableProps) {
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const warehouseUpper = warehouse.toUpperCase();
  const tableName = `supabase_transaksi${warehouseUpper}`;

  useEffect(() => {
    fetchTransactions();
  }, [warehouse]);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, startDate, endDate]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("Tanggal", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...transactions];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.Artikel?.toLowerCase().includes(search) ||
          t["Nama Barang"]?.toLowerCase().includes(search)
      );
    }

    if (startDate) {
      filtered = filtered.filter((t) => t.Tanggal >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((t) => t.Tanggal <= endDate);
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }

  function clearFilters() {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  }

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const hasActiveFilters = searchTerm || startDate || endDate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-[#002A3A] via-[#003d52] to-[#00E273] bg-clip-text text-transparent">
            {t(`warehouses.${warehouse}`)}
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            {filteredTransactions.length} {tCommon("pagination.results")}
          </p>
        </div>
        
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="border-2 border-[#002A3A] text-[#002A3A] hover:bg-[#002A3A] hover:text-white transition-all duration-300"
        >
          <Filter className="w-4 h-4 mr-2" />
          {tCommon("buttons.filter")}
        </Button>
      </div>

      {showFilters && (
        <Card className="p-6 border-2 border-[#00E273]/20 bg-gradient-to-br from-white to-gray-50/50 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t("filters.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-gray-200 focus:border-[#00E273] transition-colors"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="date"
                placeholder={t("filters.startDate")}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 border-2 border-gray-200 focus:border-[#00E273] transition-colors"
              />
            </div>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="date"
                placeholder={t("filters.endDate")}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 border-2 border-gray-200 focus:border-[#00E273] transition-colors"
              />
            </div>
          </div>
          
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-[#002A3A]"
              >
                <X className="w-4 h-4 mr-2" />
                {t("filters.clearFilters")}
              </Button>
            </div>
          )}
        </Card>
      )}

      <Card className="border-2 border-gray-200 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-12 h-12 border-4 border-[#002A3A] border-t-[#00E273] rounded-full animate-spin" />
            <p className="mt-4 text-gray-600 font-medium">{tCommon("labels.loading")}</p>
          </div>
        ) : currentTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">{tCommon("table.noResults")}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-[#002A3A] to-[#003d52] hover:from-[#002A3A] hover:to-[#003d52]">
                    <TableHead className="text-white font-bold whitespace-nowrap">{t("table.no")}</TableHead>
                    <TableHead className="text-white font-bold whitespace-nowrap">{t("table.tanggal")}</TableHead>
                    <TableHead className="text-white font-bold whitespace-nowrap">{t("table.artikel")}</TableHead>
                    <TableHead className="text-white font-bold whitespace-nowrap">{t("table.namaBarang")}</TableHead>
                    <TableHead className="text-white font-bold text-right whitespace-nowrap">{t("table.transaksiIn")}</TableHead>
                    <TableHead className="text-white font-bold text-right whitespace-nowrap">{t("table.transaksiOut")}</TableHead>
                    <TableHead className="text-white font-bold whitespace-nowrap">{t("table.gudangAsal")}</TableHead>
                    <TableHead className="text-white font-bold whitespace-nowrap">{t("table.gudangTerima")}</TableHead>
                    <TableHead className="text-white font-bold whitespace-nowrap">{t("table.dnpb")}</TableHead>
                    <TableHead className="text-white font-bold whitespace-nowrap">{t("table.noSO")}</TableHead>
                    <TableHead className="text-white font-bold whitespace-nowrap">{t("table.bstDn")}</TableHead>
                    <TableHead className="text-white font-bold whitespace-nowrap">{t("table.noPO")}</TableHead>
                    <TableHead className="text-white font-bold whitespace-nowrap">{t("table.noLPB")}</TableHead>
                    <TableHead className="text-white font-bold whitespace-nowrap">{t("table.remaks")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTransactions.map((transaction, index) => (
                    <TableRow
                      key={transaction.id}
                      className="hover:bg-[#00E273]/5 transition-colors border-b border-gray-100"
                    >
                      <TableCell className="font-mono text-sm">{transaction.No}</TableCell>
                      <TableCell className="font-medium">{transaction.Tanggal}</TableCell>
                      <TableCell className="font-semibold text-[#002A3A]">{transaction.Artikel}</TableCell>
                      <TableCell className="max-w-xs truncate">{transaction["Nama Barang"]}</TableCell>
                      <TableCell className="text-right">
                        {transaction["Transaksi in"] !== null && (
                          <span className="inline-block px-2 py-1 bg-[#00E273]/10 text-[#00E273] font-bold rounded">
                            {transaction["Transaksi in"]}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction["transaksi out"] !== null && (
                          <span className="inline-block px-2 py-1 bg-orange-100 text-orange-600 font-bold rounded">
                            {transaction["transaksi out"]}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{transaction["Gudang Asal"]}</TableCell>
                      <TableCell>{transaction["Gudang Terima"]}</TableCell>
                      <TableCell>{transaction.DNPB}</TableCell>
                      <TableCell>{transaction["No. SO"]}</TableCell>
                      <TableCell>{transaction["BST/DN"]}</TableCell>
                      <TableCell>{transaction["NO PO"]}</TableCell>
                      <TableCell>{transaction["NO LPB"]}</TableCell>
                      <TableCell className="max-w-xs truncate">{transaction.Remaks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700 font-medium">
                  {tCommon("pagination.showing")} {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)}{" "}
                  {tCommon("pagination.of")} {filteredTransactions.length} {tCommon("pagination.results")}
                </p>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="border-2 disabled:opacity-50"
                  >
                    {tCommon("pagination.first")}
                  </Button>
                  
                  <Button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="border-2 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <span className="px-4 py-2 bg-[#002A3A] text-white font-bold rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="border-2 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="border-2 disabled:opacity-50"
                  >
                    {tCommon("pagination.last")}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
