"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Header() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth.logout");
  const tNav = useTranslations("navigation");
  const tHeader = useTranslations("header");

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#002A3A] to-[#00E273] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#002A3A] to-[#00E273] bg-clip-text text-transparent">
                  Zuma WMS
                </h1>
              <p className="text-xs text-gray-500">{tHeader("warehouseManagement")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-8 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (!user) {
    return null;
  }

  const userEmail = user.email || "";
  const userName = user.user_metadata?.name || userEmail.split("@")[0];
  const userRole = user.user_metadata?.role || "User";

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#002A3A] to-[#00E273] flex items-center justify-center shadow-md">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#002A3A] to-[#00E273] bg-clip-text text-transparent">
                Zuma WMS
              </h1>
              <p className="text-xs text-gray-500">{tHeader("warehouseManagement")}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#002A3A] to-[#00E273] flex items-center justify-center text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-[#002A3A] text-[#002A3A] hover:bg-[#002A3A] hover:text-white transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {t("title")}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
