import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Warehouse Zuma",
  version: packageJson.version,
  copyright: `© ${currentYear}, Warehouse Zuma.`,
  meta: {
    title: "Warehouse Zuma - WMS Dashboard",
    description:
      "Warehouse Zuma is a Warehouse Management System dashboard for managing stock, transactions, and replenishment orders across multiple warehouse locations.",
  },
};
