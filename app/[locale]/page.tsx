"use client";

import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { useState } from "react";

export default function Home() {
  const t = useTranslations("dashboard");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#002A3A] via-[#003847] to-[#002A3A] relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00E27310_1px,transparent_1px),linear-gradient(to_bottom,#00E27310_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E273] rounded-full blur-[120px] opacity-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#00E273] rounded-full blur-[100px] opacity-5 animate-pulse delay-1000" />
      
      <Header />
      
      <main className="container mx-auto px-6 py-8 relative z-10">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in-up">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h1 className="text-6xl font-black text-white mb-3 tracking-tight">
                {t("title")}
              </h1>
              <p className="text-2xl text-[#00E273] font-light tracking-wide">
                {t("welcome")}
              </p>
            </div>
          </div>
          
          {/* Decorative line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-[#00E273] via-[#00E273]/50 to-transparent" />
        </div>

        {/* Dashboard placeholder */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">Dashboard</h2>
          <p className="text-gray-300">
            Welcome to Zuma WMS Extended. RBAC system is now active.
          </p>
        </div>
      </main>
    </div>
  );
}
