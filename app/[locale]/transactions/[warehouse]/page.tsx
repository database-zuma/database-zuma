import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { getTranslations } from "next-intl/server";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">
            Transactions - {warehouse.toUpperCase()}
          </h1>
          <p className="text-gray-600">
            Transaction data for {warehouse.toUpperCase()} warehouse will be displayed here.
          </p>
        </div>
      </main>
    </div>
  );
}
