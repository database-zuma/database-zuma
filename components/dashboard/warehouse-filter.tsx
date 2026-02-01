"use client";

import { useTranslations } from "next-intl";
import { Building2, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface WarehouseFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const WAREHOUSES = [
  { value: "all", label: "All Warehouses" },
  { value: "DDD", label: "DDD" },
  { value: "LJBB", label: "LJBB" },
  { value: "MBB", label: "MBB" },
  { value: "UBB", label: "UBB" },
];

export function WarehouseFilter({ value, onChange }: WarehouseFilterProps) {
  const t = useTranslations("common.labels");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedWarehouse = WAREHOUSES.find((w) => w.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-sm border border-[#00E273]/30 rounded-xl text-white hover:bg-white/10 hover:border-[#00E273]/50 transition-all duration-300 group"
      >
        <Building2 className="w-5 h-5 text-[#00E273]" />
        <span className="font-medium">{selectedWarehouse?.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#00E273] transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#002A3A] border border-[#00E273]/30 rounded-xl shadow-2xl overflow-hidden animate-fade-in-down z-50">
          {WAREHOUSES.map((warehouse) => (
            <button
              key={warehouse.value}
              onClick={() => {
                onChange(warehouse.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left transition-all duration-200 ${
                value === warehouse.value
                  ? "bg-[#00E273]/20 text-[#00E273] font-semibold"
                  : "text-white/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              {warehouse.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
