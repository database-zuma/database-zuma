"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { WarehouseFilter } from "@/components/dashboard/warehouse-filter";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StockChart } from "@/components/dashboard/stock-chart";
import { useState } from "react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002A3A] via-[#003847] to-[#002A3A]">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
              <p className="text-white/60">{t("welcome")}</p>
            </div>
            <WarehouseFilter
              value={selectedWarehouse}
              onChange={setSelectedWarehouse}
            />
          </div>

          <DashboardMetrics warehouse={selectedWarehouse} />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">
                {t("stockOverview")}
              </h2>
              <StockChart warehouse={selectedWarehouse} />
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">
                {t("recentActivity")}
              </h2>
              <RecentActivity warehouse={selectedWarehouse} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
