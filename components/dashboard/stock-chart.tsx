"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { BarChart3 } from "lucide-react";

interface StockChartProps {
  warehouse: string;
}

interface WarehouseStock {
  warehouse: string;
  stock: number;
}

export function StockChart({ warehouse }: StockChartProps) {
  const t = useTranslations("dashboard.charts");
  const [data, setData] = useState<WarehouseStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStockData() {
      setLoading(true);
      const supabase = createClient();

      try {
        let query = supabase
          .from("master_mutasi_whs")
          .select("kode_whs, qty_akhir");

        if (warehouse !== "all") {
          query = query.eq("kode_whs", warehouse);
        }

        const { data: stockData } = await query;

        const warehouseMap = new Map<string, number>();
        
        stockData?.forEach((item) => {
          const whs = item.kode_whs || "Unknown";
          const qty = Number(item.qty_akhir) || 0;
          warehouseMap.set(whs, (warehouseMap.get(whs) || 0) + qty);
        });

        const chartData = Array.from(warehouseMap.entries())
          .map(([warehouse, stock]) => ({ warehouse, stock }))
          .sort((a, b) => b.stock - a.stock);

        setData(chartData);
      } catch (error) {
        console.error("Error fetching stock data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStockData();
  }, [warehouse]);

  const maxStock = Math.max(...data.map((d) => d.stock), 1);

  return (
    <div className="animate-fade-in-up delay-500">
      <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#00E273] to-[#00B85C]">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {t("warehouseCapacity")}
          </h3>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            No stock data available
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item, index) => (
              <div
                key={item.warehouse}
                className="group animate-fade-in-right"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                    {item.warehouse}
                  </span>
                  <span className="text-lg font-black text-[#00E273]">
                    {item.stock.toLocaleString()}
                  </span>
                </div>
                
                <div className="relative h-8 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00E273] to-[#00B85C] rounded-full transition-all duration-1000 ease-out group-hover:shadow-[0_0_20px_rgba(0,226,115,0.5)]"
                    style={{
                      width: `${(item.stock / maxStock) * 100}%`,
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
