import { Header } from "@/components/header";

export default function StockPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-1 h-12 bg-gradient-to-b from-[#002A3A] to-[#00E273] rounded-full" />
            <div>
              <h1 className="text-4xl font-black tracking-tight text-[#002A3A]">
                Current Stock
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Real-time inventory across all warehouses (Coming Soon)
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StockTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
