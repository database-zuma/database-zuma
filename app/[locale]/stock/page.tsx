"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";

export default function StockPage() {
  const t = useTranslations("stock");
  const tCommon = useTranslations("common.buttons");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="w-1 h-12 bg-gradient-to-b from-[#002A3A] to-[#00E273] rounded-full" />
              <div>
                <h1 className="text-4xl font-black tracking-tight text-[#002A3A]">
                  {t("title")}
                </h1>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  {t("comingSoon")}
                </p>
              </div>
            </div>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="no-print border-2 border-[#002A3A] hover:bg-[#002A3A] hover:text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              {tCommon("print")} Stock Report
            </Button>
          </div>
        </div>

        <div className="print-only print-header">
          <div className="print-logo">ZUMA WMS - Stock Report</div>
          <div className="print-timestamp">
            Printed: {new Date().toLocaleString()}
          </div>
        </div>
      </main>
    </div>
  );
}

function StockTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
