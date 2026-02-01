"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const tErrors = useTranslations("auth.errors");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email) {
      setError(tErrors("emailRequired"));
      setLoading(false);
      return;
    }

    if (!password) {
      setError(tErrors("passwordRequired"));
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(tErrors("invalidEmail"));
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError(tErrors("passwordTooShort"));
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError(tErrors("invalidCredentials"));
        } else {
          setError(tErrors("invalidCredentials"));
        }
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(tErrors("invalidCredentials"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002A3A] via-[#003847] to-[#002A3A] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,226,115,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,226,115,0.08),transparent_50%)]" />
      
      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/95 shadow-2xl border-0">
        <CardHeader className="space-y-3 pb-6">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#002A3A] to-[#00E273] flex items-center justify-center shadow-lg">
              <svg
                className="w-10 h-10 text-white"
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
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-[#002A3A] to-[#00E273] bg-clip-text text-transparent">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-center text-base text-gray-600">
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                disabled={loading}
                className="h-11 border-gray-300 focus:border-[#00E273] focus:ring-[#00E273]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                {t("password")}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="h-11 border-gray-300 focus:border-[#00E273] focus:ring-[#00E273]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-gray-300 text-[#00E273] focus:ring-[#00E273] cursor-pointer"
              />
              <Label
                htmlFor="remember"
                className="text-sm text-gray-600 cursor-pointer select-none"
              >
                {t("rememberMe")}
              </Label>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-[#002A3A] to-[#00E273] hover:from-[#003847] hover:to-[#00cc66] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t("submit")}</span>
                </div>
              ) : (
                t("submit")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
