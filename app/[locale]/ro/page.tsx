"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  Box,
  Layers
} from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DashboardStats {
  totalRO: number;
  queued: number;
  totalBoxes: number;
  totalPairs: number;
}

interface ROItem {
  id: string;
  store: string;
  box: number;
  status: string;
}

type ROStatus = 'queue' | 'approved' | 'picking' | 'pick_verified' | 'dnpb_process' | 'ready_to_ship' | 'in_delivery' | 'arrived' | 'completed';

export default function ROPage() {
  const router = useRouter();
  const t = useTranslations("ro");
  const [stats, setStats] = useState<DashboardStats>({ totalRO: 0, queued: 0, totalBoxes: 0, totalPairs: 0 });
  const [roData, setRoData] = useState<ROItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONGOING' | 'SHIPPING' | 'COMPLETE'>('ALL');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ro/dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data.stats ?? { totalRO: 0, queued: 0, totalBoxes: 0, totalPairs: 0 });
        setRoData(json.data.roList ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredROList = useMemo(() => {
    const ONGOING_STATUSES: ROStatus[] = ['queue', 'approved', 'picking', 'pick_verified', 'dnpb_process'];
    const SHIPPING_STATUSES: ROStatus[] = ['ready_to_ship', 'in_delivery', 'arrived'];
    
    return roData.filter(ro => {
      let matchesStatus = false;
      const roStatus = ro.status.toLowerCase() as ROStatus;
      
      if (statusFilter === 'ALL') matchesStatus = true;
      else if (statusFilter === 'ONGOING') matchesStatus = ONGOING_STATUSES.includes(roStatus);
      else if (statusFilter === 'SHIPPING') matchesStatus = SHIPPING_STATUSES.includes(roStatus);
      else if (statusFilter === 'COMPLETE') matchesStatus = roStatus === 'completed';
      
      const matchesSearch = searchQuery === '' || 
        ro.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ro.store.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [roData, statusFilter, searchQuery]);

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return { label: 'Complete', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
      case 'in_delivery':
        return { label: 'Delivery', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'ready_to_ship':
        return { label: 'Ready', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      case 'dnpb_process':
        return { label: 'DNPB', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'picking':
      case 'pick_verified':
        return { label: 'Picking', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
      case 'approved':
        return { label: 'Approved', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' };
      case 'queue':
        return { label: 'Queue', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' };
      default:
        return { label: status, color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' };
    }
  };

  const statsCards = [
    { 
      value: stats.totalRO.toString(), 
      label: 'Total RO', 
      icon: Package,
      gradient: 'from-[#002A3A] to-[#003847]',
      iconBg: 'bg-[#00E273]/20',
      iconColor: 'text-[#00E273]'
    },
    { 
      value: stats.queued.toString(), 
      label: 'Queued', 
      icon: Clock,
      gradient: 'from-amber-600 to-orange-600',
      iconBg: 'bg-white/20',
      iconColor: 'text-white'
    },
    { 
      value: stats.totalBoxes.toString(), 
      label: 'Total Boxes', 
      icon: Box,
      gradient: 'from-[#00E273] to-[#00B85E]',
      iconBg: 'bg-white/20',
      iconColor: 'text-white'
    },
    { 
      value: stats.totalPairs.toString(), 
      label: 'Total Pairs', 
      icon: Layers,
      gradient: 'from-purple-600 to-pink-600',
      iconBg: 'bg-white/20',
      iconColor: 'text-white'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-black text-[#002A3A] mb-2 tracking-tight">
                Replenishment Orders
              </h1>
              <p className="text-lg text-gray-600 font-light">
                Manage store replenishment requests and fulfillment
              </p>
            </div>
            
            <Button
              onClick={fetchDashboardData}
              disabled={isLoading}
              variant="outline"
              className="border-[#002A3A] text-[#002A3A] hover:bg-[#002A3A] hover:text-white transition-all"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="h-1 w-32 bg-gradient-to-r from-[#00E273] to-transparent rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full -ml-12 -mb-12" />
                
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-4xl font-black text-white mb-1">
                      {isLoading ? '-' : stat.value}
                    </p>
                    <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                  </div>
                  <div className={`${stat.iconBg} rounded-xl p-3`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#002A3A] to-[#00E273] flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">All Replenishment Orders</h2>
                  <p className="text-sm text-gray-500">{filteredROList.length} orders found</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search RO ID or Store..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-[#00E273] focus:ring-[#00E273]"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                  {[
                    { key: 'ALL', label: 'All', icon: Filter },
                    { key: 'ONGOING', label: 'Ongoing', icon: Clock },
                    { key: 'SHIPPING', label: 'Shipping', icon: Truck },
                    { key: 'COMPLETE', label: 'Complete', icon: CheckCircle2 },
                  ].map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      onClick={() => setStatusFilter(key as any)}
                      variant={statusFilter === key ? "default" : "outline"}
                      size="sm"
                      className={`whitespace-nowrap ${
                        statusFilter === key 
                          ? 'bg-[#002A3A] hover:bg-[#003847] text-white' 
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-3 h-3 mr-1.5" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                  <th className="py-4 px-6">RO ID</th>
                  <th className="py-4 px-6">Store</th>
                  <th className="py-4 px-6 text-center">Boxes</th>
                  <th className="py-4 px-6 text-right">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#00E273]" />
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredROList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No RO requests found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredROList.map((ro, index) => {
                    const badge = getStatusBadge(ro.status);
                    return (
                      <tr 
                        key={ro.id} 
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                        onClick={() => router.push(`/en/ro/${ro.id}`)}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs font-semibold text-[#002A3A] bg-[#002A3A]/5 px-3 py-1.5 rounded-lg">
                            {ro.id}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-900">{ro.store}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                            <Box className="w-4 h-4 text-[#00E273]" />
                            {ro.box}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#00E273] hover:text-[#00B85E] hover:bg-[#00E273]/10"
                          >
                            View Details →
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
