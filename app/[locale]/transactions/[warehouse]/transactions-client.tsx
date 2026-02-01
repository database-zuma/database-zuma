"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";

interface TransactionsClientProps {
  warehouse: string;
}

export function TransactionsClient({ warehouse }: TransactionsClientProps) {
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common.buttons");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {t("title")} - {warehouse.toUpperCase()}
          </h1>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="no-print border-2 border-[#002A3A] hover:bg-[#002A3A] hover:text-white"
          >
            <Printer className="w-4 h-4 mr-2" />
            {tCommon("print")} Transaction Report
          </Button>
        </div>

        <div className="print-only print-header">
          <div className="print-logo">ZUMA WMS - Transaction Report</div>
          <div className="print-timestamp">
            Warehouse: {warehouse.toUpperCase()} | Printed: {new Date().toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            {t("forWarehouse", { warehouse: warehouse.toUpperCase() })}
          </p>
        </div>
      </main>
    </div>
  );
}
