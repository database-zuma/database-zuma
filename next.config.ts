import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: "/root/clawd/harvey-projects/zuma-ro-pwa-extended/zuma-wms-extended",
  },
};

export default withNextIntl(nextConfig);
