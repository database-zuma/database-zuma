"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { Package, TrendingDown, FileText, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardMetricsProps {
  warehouse: string;
}

interface MetricData {
  totalStock: number;
  lowStockItems: number;
  pendingROs: number;
  todayTransactions: number;
}

export function DashboardMetrics({ warehouse }: DashboardMetricsProps) {
  const t = useTranslations("dashboard.metrics");
  const [metrics, setMetrics] = useState<MetricData>({
    totalStock: 0,
    lowStockItems: 0,
    pendingROs: 0,
    todayTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      const supabase = createClient();

      try {
        let stockQuery = supabase
          .from("master_mutasi_whs")
          .select("qty_akhir, kode_whs");

        if (warehouse !== "all") {
          stockQuery = stockQuery.eq("kode_whs", warehouse);
        }

        const { data: stockData } = await stockQuery;

        const totalStock = stockData?.reduce(
          (sum, item) => sum + (Number(item.qty_akhir) || 0),
          0
        ) || 0;

        const lowStockItems = stockData?.filter(
          (item) => Number(item.qty_akhir) < 10
        ).length || 0;

        let roQuery = supabase
          .from("ro_process")
          .select("status");

        const { data: roData } = await roQuery;

        const pendingROs = roData?.filter(
          (ro) => ro.status === "pending" || ro.status === "draft"
        ).length || 0;

        const today = new Date().toISOString().split("T")[0];
        let transactionQuery = supabase
          .from("master_mutasi_whs")
          .select("id")
          .gte("created_at", today);

        if (warehouse !== "all") {
          transactionQuery = transactionQuery.eq("kode_whs", warehouse);
        }

        const { data: transactionData } = await transactionQuery;
        const todayTransactions = transactionData?.length || 0;

        setMetrics({
          totalStock,
          lowStockItems,
          pendingROs,
          todayTransactions,
        });

        const channel = supabase
          .channel("dashboard-realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "master_mutasi_whs",
            },
            () => {
              fetchMetrics();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "ro_process",
            },
            () => {
              fetchMetrics();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [warehouse]);

  const metricsData = [
    {
      title: t("totalStock"),
      value: metrics.totalStock.toLocaleString(),
      icon: Package,
      color: "from-[#00E273] to-[#00B85C]",
      bgGlow: "bg-[#00E273]/10",
      delay: "delay-100",
    },
    {
      title: t("lowStock"),
      value: metrics.lowStockItems.toLocaleString(),
      icon: TrendingDown,
      color: "from-orange-500 to-red-500",
      bgGlow: "bg-orange-500/10",
      delay: "delay-200",
    },
    {
      title: t("pendingRO"),
      value: metrics.pendingROs.toLocaleString(),
      icon: FileText,
      color: "from-blue-400 to-cyan-400",
      bgGlow: "bg-blue-400/10",
      delay: "delay-300",
    },
    {
      title: t("todayTransactions"),
      value: metrics.todayTransactions.toLocaleString(),
      icon: Activity,
      color: "from-purple-400 to-pink-400",
      bgGlow: "bg-purple-400/10",
      delay: "delay-[400ms]",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {metricsData.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.title}
            className={`animate-fade-in-up ${metric.delay} group`}
          >
            <div className="relative">
              <div
                className={`absolute inset-0 ${metric.bgGlow} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}
              />
              
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  {loading && (
                    <div className="w-2 h-2 bg-[#00E273] rounded-full animate-pulse" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-white/60 font-medium tracking-wide uppercase">
                    {metric.title}
                  </p>
                  <p className="text-4xl font-black text-white tracking-tight">
                    {loading ? (
                      <span className="inline-block w-20 h-10 bg-white/10 rounded animate-pulse" />
                    ) : (
                      metric.value
                    )}
                  </p>
                </div>

                <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${metric.color} animate-pulse`}
                    style={{ width: loading ? "0%" : "100%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
