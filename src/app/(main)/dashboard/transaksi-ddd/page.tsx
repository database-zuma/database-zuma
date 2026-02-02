"use client";

import { useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";

interface TransaksiDDD {
  id: number;
  No: number | null;
  Tanggal: string | null;
  Artikel: string | null;
  "Nama Barang": string | null;
  "Transaksi in": number | null;
  "transaksi out": number | null;
  "Gudang Asal": string | null;
  "Gudang Terima": string | null;
  DNPB: string | null;
  "No. SO": string | null;
  "BST/DN": string | null;
  "NO PO": string | null;
  "NO LPB": string | null;
  Remaks: string | null;
}

export default function Page() {
  const [data, setData] = useState<TransaksiDDD[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: transaksiData, error: fetchError } = await supabase
          .from("supabase_transkasiDDD")
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transaksi DDD</h1>
        <p className="text-sm text-muted-foreground">
          {data.length} records
        </p>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead className="w-[50px]">No</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Artikel</TableHead>
              <TableHead>Nama Barang</TableHead>
              <TableHead className="text-right">Transaksi In</TableHead>
              <TableHead className="text-right">Transaksi Out</TableHead>
              <TableHead>Gudang Asal</TableHead>
              <TableHead>Gudang Terima</TableHead>
              <TableHead>DNPB</TableHead>
              <TableHead>No. SO</TableHead>
              <TableHead>BST/DN</TableHead>
              <TableHead>NO PO</TableHead>
              <TableHead>NO LPB</TableHead>
              <TableHead>Remaks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="h-24 text-center">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.No}</TableCell>
                  <TableCell>{row.Tanggal}</TableCell>
                  <TableCell>{row.Artikel}</TableCell>
                  <TableCell>{row["Nama Barang"]}</TableCell>
                  <TableCell className="text-right">
                    {row["Transaksi in"]}
                  </TableCell>
                  <TableCell className="text-right">
                    {row["transaksi out"]}
                  </TableCell>
                  <TableCell>{row["Gudang Asal"]}</TableCell>
                  <TableCell>{row["Gudang Terima"]}</TableCell>
                  <TableCell>{row.DNPB}</TableCell>
                  <TableCell>{row["No. SO"]}</TableCell>
                  <TableCell>{row["BST/DN"]}</TableCell>
                  <TableCell>{row["NO PO"]}</TableCell>
                  <TableCell>{row["NO LPB"]}</TableCell>
                  <TableCell>{row.Remaks}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
