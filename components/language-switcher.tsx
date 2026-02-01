"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { locales, localeLabels, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    localStorage.setItem("preferred-locale", newLocale);

    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
    router.refresh();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="size-4" />
        <span className="hidden sm:inline">
          {localeLabels[locale as Locale]}
        </span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-md border bg-popover p-1 shadow-md">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  locale === loc ? "bg-accent" : ""
                }`}
              >
                <span>{localeLabels[loc]}</span>
                {locale === loc && <Check className="size-4 ml-2" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
