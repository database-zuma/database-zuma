"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import { Clock, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

interface RecentActivityProps {
  warehouse: string;
}

interface Activity {
  id: string;
  type: "in" | "out" | "transfer";
  warehouse: string;
  quantity: number;
  timestamp: string;
  product?: string;
}

export function RecentActivity({ warehouse }: RecentActivityProps) {
  const t = useTranslations("dashboard.recentActivity");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      const supabase = createClient();

      try {
        let query = supabase
          .from("master_mutasi_whs")
          .select("id, kode_whs, qty_akhir, created_at, kode_brg")
          .order("created_at", { ascending: false })
          .limit(10);

        if (warehouse !== "all") {
          query = query.eq("kode_whs", warehouse);
        }

        const { data } = await query;

        const formattedActivities: Activity[] =
          data?.map((item) => ({
            id: item.id,
            type: Number(item.qty_akhir) > 0 ? "in" : "out",
            warehouse: item.kode_whs || "Unknown",
            quantity: Math.abs(Number(item.qty_akhir) || 0),
            timestamp: item.created_at,
            product: item.kode_brg,
          })) || [];

        setActivities(formattedActivities);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [warehouse]);

  function getActivityIcon(type: Activity["type"]) {
    switch (type) {
      case "in":
        return <ArrowDownRight className="w-4 h-4" />;
      case "out":
        return <ArrowUpRight className="w-4 h-4" />;
      case "transfer":
        return <RefreshCw className="w-4 h-4" />;
    }
  }

  function getActivityColor(type: Activity["type"]) {
    switch (type) {
      case "in":
        return "from-[#00E273] to-[#00B85C]";
      case "out":
        return "from-orange-500 to-red-500";
      case "transfer":
        return "from-blue-400 to-cyan-400";
    }
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  return (
    <div className="animate-fade-in-up delay-500">
      <div className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">{t("title")}</h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            No recent activity
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className="group animate-fade-in-left"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-white/10">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-br ${getActivityColor(
                      activity.type
                    )} flex-shrink-0`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {activity.warehouse}
                      </p>
                      <span className="text-xs text-white/40 flex-shrink-0">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-white/60 truncate">
                        {activity.product || "Unknown Product"}
                      </p>
                      <span className="text-sm font-bold text-[#00E273] flex-shrink-0">
                        {activity.quantity.toLocaleString()}
                      </span>
                    </div>
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
