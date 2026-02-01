"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X, RefreshCw } from "lucide-react";

interface FilterState {
  entitas: string;
  tier: string;
  gender: string;
  series: string;
  search: string;
}

export function StockFilters() {
  const [filters, setFilters] = useState<FilterState>({
    entitas: "",
    tier: "",
    gender: "",
    series: "",
    search: "",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleReset = () => {
    setFilters({
      entitas: "",
      tier: "",
      gender: "",
      series: "",
      search: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-[#002A3A] to-[#002A3A]/90 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00E273] flex items-center justify-center">
              <Filter className="w-5 h-5 text-[#002A3A]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Filters & Search</h2>
              <p className="text-sm text-gray-300 font-medium">
                Narrow down your stock view
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold"
          >
            {isExpanded ? "Hide" : "Show"} Filters
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Search Article
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Code or name..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10 border-2 border-gray-200 focus:border-[#00E273] rounded-xl font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Warehouse (Entitas)
              </label>
              <select
                value={filters.entitas}
                onChange={(e) =>
                  setFilters({ ...filters, entitas: e.target.value })
                }
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00E273] focus:outline-none font-medium bg-white"
              >
                <option value="">All Warehouses</option>
                <option value="DDD">DDD Warehouse</option>
                <option value="LJBB">LJBB Warehouse</option>
                <option value="MBB">MBB Warehouse</option>
                <option value="UBB">UBB Warehouse</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Tier Level
              </label>
              <select
                value={filters.tier}
                onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00E273] focus:outline-none font-medium bg-white"
              >
                <option value="">All Tiers</option>
                <option value="1">Tier 1</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={filters.gender}
                onChange={(e) =>
                  setFilters({ ...filters, gender: e.target.value })
                }
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-[#00E273] focus:outline-none font-medium bg-white"
              >
                <option value="">All Genders</option>
                <option value="M">Men</option>
                <option value="W">Women</option>
                <option value="U">Unisex</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Series
              </label>
              <Input
                type="text"
                placeholder="Enter series..."
                value={filters.series}
                onChange={(e) =>
                  setFilters({ ...filters, series: e.target.value })
                }
                className="border-2 border-gray-200 focus:border-[#00E273] rounded-xl font-medium"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 hover:text-red-600 font-bold rounded-xl transition-all"
                disabled={!hasActiveFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap p-4 bg-[#00E273]/10 rounded-xl border-2 border-[#00E273]/20">
              <span className="text-sm font-bold text-[#002A3A]">
                Active Filters:
              </span>
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700 border border-gray-200">
                  Search: {filters.search}
                  <button
                    onClick={() => setFilters({ ...filters, search: "" })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.entitas && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700 border border-gray-200">
                  Warehouse: {filters.entitas}
                  <button
                    onClick={() => setFilters({ ...filters, entitas: "" })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.tier && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700 border border-gray-200">
                  Tier: {filters.tier}
                  <button
                    onClick={() => setFilters({ ...filters, tier: "" })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.gender && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700 border border-gray-200">
                  Gender: {filters.gender}
                  <button
                    onClick={() => setFilters({ ...filters, gender: "" })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.series && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700 border border-gray-200">
                  Series: {filters.series}
                  <button
                    onClick={() => setFilters({ ...filters, series: "" })}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
