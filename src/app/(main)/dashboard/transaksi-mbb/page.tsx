"use client";

import { useEffect, useState } from "react";

import { TransactionTable } from "@/components/transaction-table";
import { supabase } from "@/lib/supabase";

const columns = [
  { key: "No", label: "No" },
  { key: "Tanggal", label: "Tanggal" },
  { key: "Artikel", label: "Artikel" },
  { key: "Nama Barang", label: "Nama Barang" },
  { key: "Transaksi in", label: "Transaksi In", align: "right" as const },
  { key: "transaksi out", label: "Transaksi Out", align: "right" as const },
  { key: "Gudang Asal", label: "Gudang Asal" },
  { key: "Gudang Terima", label: "Gudang Terima" },
  { key: "DNPB", label: "DNPB" },
  { key: "No. SO", label: "No. SO" },
  { key: "BST/DN", label: "BST/DN" },
  { key: "NO PO", label: "NO PO" },
  { key: "NO LPB", label: "NO LPB" },
  { key: "Remaks", label: "Remaks" },
];

export default function Page() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: transaksiData, error: fetchError } = await supabase
          .from("supabase_transkasiMBB")
          .select("*")
          .order("id", { ascending: false });

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        setData(transaksiData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return <TransactionTable data={data} columns={columns} entityName="MBB" />;
}
