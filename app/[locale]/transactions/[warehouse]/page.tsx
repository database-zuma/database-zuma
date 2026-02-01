import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { getTranslations } from "next-intl/server";
import { TransactionsClient } from "./transactions-client";

const VALID_WAREHOUSES = ["ddd", "ljbb", "mbb", "ubb"] as const;
type ValidWarehouse = typeof VALID_WAREHOUSES[number];

interface PageProps {
  params: Promise<{
    locale: string;
    warehouse: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { warehouse } = await params;
  const t = await getTranslations("transactions");
  
  const warehouseUpper = warehouse.toUpperCase();
  return {
    title: `${t("title")} - ${warehouseUpper}`,
    description: `${t("title")} for ${warehouseUpper} warehouse`,
  };
}

export default async function TransactionsPage({ params }: PageProps) {
  const { warehouse } = await params;
  const warehouseLower = warehouse.toLowerCase();
  
  if (!VALID_WAREHOUSES.includes(warehouseLower as ValidWarehouse)) {
    notFound();
  }

  return <TransactionsClient warehouse={warehouse} />;
}
