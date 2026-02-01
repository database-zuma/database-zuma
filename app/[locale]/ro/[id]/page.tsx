"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  ArrowLeft,
  Clock, 
  CheckCircle2, 
  Package, 
  Truck, 
  Home,
  Database,
  RefreshCw,
  ChevronRight,
  Box,
  Edit3,
  Save,
  X,
  TrendingUp
} from "lucide-react";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ROArticle {
  kodeArtikel: string;
  namaArtikel: string;
  boxesRequested: number;
  dddBoxes: number;
  ljbbBoxes: number;
  mbbBoxes: number;
  ubbBoxes: number;
}

interface RODetail {
  id: string;
  store: string;
  createdAt: string;
  currentStatus: ROStatus;
  dnpbNumber: string | null;
  dnpbMatch: string | null;
  totalBoxes: number;
  totalArticles: number;
  dddBoxes: number;
  ljbbBoxes: number;
  mbbBoxes: number;
  ubbBoxes: number;
  articles: ROArticle[];
}

type ROStatus = 'QUEUE' | 'APPROVED' | 'PICKING' | 'PICK_VERIFIED' | 'DNPB_PROCESS' | 'READY_TO_SHIP' | 'IN_DELIVERY' | 'ARRIVED' | 'COMPLETED';

const statusFlow: { id: ROStatus; label: string; icon: React.ElementType; description: string; color: string }[] = [
  { id: 'QUEUE', label: 'Queue', icon: Clock, description: 'Awaiting approval', color: 'text-gray-600' },
  { id: 'APPROVED', label: 'Approved', icon: CheckCircle2, description: 'WH Supervisor approved', color: 'text-cyan-600' },
  { id: 'PICKING', label: 'Picking', icon: Package, description: 'Being picked from warehouse', color: 'text-orange-600' },
  { id: 'PICK_VERIFIED', label: 'Verified', icon: CheckCircle2, description: 'Pick quantities verified', color: 'text-blue-600' },
  { id: 'DNPB_PROCESS', label: 'DNPB', icon: Database, description: 'Delivery note processing', color: 'text-amber-600' },
  { id: 'READY_TO_SHIP', label: 'Ready', icon: Package, description: 'Ready for dispatch', color: 'text-purple-600' },
  { id: 'IN_DELIVERY', label: 'Delivery', icon: Truck, description: 'Out for delivery', color: 'text-blue-600' },
  { id: 'ARRIVED', label: 'Arrived', icon: Home, description: 'Received at store', color: 'text-indigo-600' },
  { id: 'COMPLETED', label: 'Completed', icon: CheckCircle2, description: 'Order closed', color: 'text-emerald-600' },
];

export default function RODetailPage() {
  const router = useRouter();
  const params = useParams();
  const roId = params.id as string;
  const t = useTranslations("ro");
  
  const [roDetail, setRoDetail] = useState<RODetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dnpbInput, setDnpbInput] = useState("");
  const [viewArticles, setViewArticles] = useState(false);
  const [editedArticles, setEditedArticles] = useState<Record<string, { ddd: number; ljbb: number; mbb: number; ubb: number }>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchRODetail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ro/process');
      const json = await res.json();
      if (json.success && json.data) {
        const ro = json.data.find((r: RODetail) => r.id === roId);
        if (ro) {
          setRoDetail(ro);
          if (ro.dnpbNumber) {
            setDnpbInput(ro.dnpbNumber);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch RO detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRODetail();
  }, [roId]);

  const currentStatusIndex = roDetail ? statusFlow.findIndex(s => s.id === roDetail.currentStatus) : -1;

  const handleAdvanceStatus = async () => {
    if (!roDetail) return;
    
    const currentIndex = statusFlow.findIndex(s => s.id === roDetail.currentStatus);
    if (currentIndex >= statusFlow.length - 1) {
      alert('Order already completed');
      return;
    }
    
    const nextStatus = statusFlow[currentIndex + 1];
    if (!confirm(`Advance status to "${nextStatus.label}"?`)) return;
    
    if (roDetail.currentStatus === 'DNPB_PROCESS') {
      const dnpbToSave = dnpbInput || roDetail.dnpbNumber;
      if (!dnpbToSave) {
        alert('DNPB Number is required before proceeding');
        return;
      }
      
      setIsUpdating(true);
      try {
        const dnpbRes = await fetch('/api/ro/dnpb', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roId: roDetail.id, dnpbNumber: dnpbToSave })
        });
        const dnpbResult = await dnpbRes.json();
        if (!dnpbResult.success) {
          alert(`DNPB Error: ${dnpbResult.error}`);
          setIsUpdating(false);
          return;
        }
      } catch (error) {
        alert('Failed to save DNPB number');
        setIsUpdating(false);
        return;
      }
    }
    
    setIsUpdating(true);
    
    try {
      const res = await fetch('/api/ro/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roId: roDetail.id, status: nextStatus.id })
      });
      
      const result = await res.json();
      
      if (result.success) {
        setRoDetail({ ...roDetail, currentStatus: nextStatus.id, dnpbNumber: dnpbInput || roDetail.dnpbNumber });
        setDnpbInput('');
        alert(`Status updated to ${nextStatus.label}`);
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert('Failed to update status');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getArticleValues = useCallback((article: ROArticle) => {
    const edited = editedArticles[article.kodeArtikel];
    return {
      ddd: edited?.ddd ?? article.dddBoxes,
      ljbb: edited?.ljbb ?? article.ljbbBoxes,
      mbb: edited?.mbb ?? article.mbbBoxes,
      ubb: edited?.ubb ?? article.ubbBoxes,
    };
  }, [editedArticles]);

  const updateArticleQty = useCallback((articleCode: string, field: 'ddd' | 'ljbb' | 'mbb' | 'ubb', delta: number) => {
    if (!roDetail) return;
    const article = roDetail.articles.find(a => a.kodeArtikel === articleCode);
    if (!article) return;
    
    const edited = editedArticles[article.kodeArtikel];
    const current = {
      ddd: edited?.ddd ?? article.dddBoxes,
      ljbb: edited?.ljbb ?? article.ljbbBoxes,
      mbb: edited?.mbb ?? article.mbbBoxes,
      ubb: edited?.ubb ?? article.ubbBoxes,
    };
    const newValue = Math.max(0, current[field] + delta);
    
    setEditedArticles(prev => ({
      ...prev,
      [articleCode]: {
        ...current,
        [field]: newValue,
      }
    }));
  }, [roDetail, editedArticles]);

  const saveArticleChanges = async () => {
    if (!roDetail || Object.keys(editedArticles).length === 0) return;
    
    setIsSaving(true);
    try {
      const updatePromises = Object.entries(editedArticles).map(async ([articleCode, values]) => {
        const res = await fetch('/api/ro/articles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roId: roDetail.id,
            articleCode,
            dddBoxes: values.ddd,
            ljbbBoxes: values.ljbb,
            mbbBoxes: values.mbb,
            ubbBoxes: values.ubb,
          })
        });
        const result = await res.json();
        return { articleCode, success: result.success, error: result.error };
      });

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => !r.success);
      
      if (errors.length > 0) {
        alert(`Failed to update: ${errors.map(e => e.articleCode).join(', ')}`);
      } else {
        alert('Changes saved successfully');
      }
      
      setEditedArticles({});
      await fetchRODetail();
    } catch (error) {
      alert('Failed to save changes');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Object.keys(editedArticles).length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="w-12 h-12 animate-spin text-[#00E273]" />
          </div>
        </main>
      </div>
    );
  }

  if (!roDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">RO Not Found</h2>
            <p className="text-gray-500 mb-6">The requested RO does not exist</p>
            <Button onClick={() => router.push('/en/ro')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to RO List
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (viewArticles) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Header />
        <main className="container mx-auto px-6 py-8">
          <Button
            onClick={() => {
              if (hasChanges && !confirm('You have unsaved changes. Discard them?')) return;
              setViewArticles(false);
              setEditedArticles({});
            }}
            variant="ghost"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to RO Detail
          </Button>

          <div className="bg-gradient-to-br from-[#002A3A] to-[#003847] rounded-2xl p-6 text-white mb-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs opacity-80 font-mono mb-1">{roDetail.id}</p>
                <p className="text-2xl font-bold">{roDetail.store}</p>
                <p className="text-sm opacity-80 mt-2">{roDetail.totalArticles} articles • {roDetail.totalBoxes} boxes</p>
              </div>
              <span className="px-4 py-2 bg-white/20 rounded-xl text-sm font-semibold backdrop-blur-sm">
                {roDetail.currentStatus}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#002A3A] to-[#00E273] flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Article Breakdown</h3>
              </div>
              {hasChanges && (
                <Button
                  onClick={saveArticleChanges}
                  disabled={isSaving}
                  className="bg-[#00E273] hover:bg-[#00B85E] text-white"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
                    <th className="py-4 px-6">Article</th>
                    <th className="py-4 px-4 text-center">Requested</th>
                    <th className="py-4 px-4 text-center text-blue-600">DDD</th>
                    <th className="py-4 px-4 text-center text-purple-600">LJBB</th>
                    <th className="py-4 px-4 text-center text-amber-600">MBB</th>
                    <th className="py-4 px-4 text-center text-emerald-600">UBB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {roDetail.articles.map((article, idx) => {
                    const values = getArticleValues(article);
                    const isEdited = !!editedArticles[article.kodeArtikel];
                    return (
                      <tr key={idx} className={`hover:bg-gray-50/50 transition-colors ${isEdited ? 'bg-amber-50/50' : ''}`}>
                        <td className="py-4 px-6">
                          <p className="font-mono text-xs text-gray-500 mb-0.5">{article.kodeArtikel}</p>
                          <p className="text-gray-900 font-medium text-sm">{article.namaArtikel}</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-semibold text-gray-900">{article.boxesRequested}</span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => updateArticleQty(article.kodeArtikel, 'ddd', -1)} className="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-bold transition-colors">-</button>
                            <span className="min-w-[32px] text-blue-700 font-semibold">{values.ddd}</span>
                            <button onClick={() => updateArticleQty(article.kodeArtikel, 'ddd', 1)} className="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-bold transition-colors">+</button>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => updateArticleQty(article.kodeArtikel, 'ljbb', -1)} className="w-7 h-7 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-bold transition-colors">-</button>
                            <span className="min-w-[32px] text-purple-700 font-semibold">{values.ljbb}</span>
                            <button onClick={() => updateArticleQty(article.kodeArtikel, 'ljbb', 1)} className="w-7 h-7 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-bold transition-colors">+</button>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => updateArticleQty(article.kodeArtikel, 'mbb', -1)} className="w-7 h-7 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm font-bold transition-colors">-</button>
                            <span className="min-w-[32px] text-amber-700 font-semibold">{values.mbb}</span>
                            <button onClick={() => updateArticleQty(article.kodeArtikel, 'mbb', 1)} className="w-7 h-7 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm font-bold transition-colors">+</button>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => updateArticleQty(article.kodeArtikel, 'ubb', -1)} className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm font-bold transition-colors">-</button>
                            <span className="min-w-[32px] text-emerald-700 font-semibold">{values.ubb}</span>
                            <button onClick={() => updateArticleQty(article.kodeArtikel, 'ubb', 1)} className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm font-bold transition-colors">+</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  {(() => {
                    const totals = roDetail.articles.reduce((acc, article) => {
                      const values = getArticleValues(article);
                      return { 
                        ddd: acc.ddd + values.ddd, 
                        ljbb: acc.ljbb + values.ljbb,
                        mbb: acc.mbb + values.mbb,
                        ubb: acc.ubb + values.ubb
                      };
                    }, { ddd: 0, ljbb: 0, mbb: 0, ubb: 0 });
                    return (
                      <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                        <td className="py-4 px-6 text-gray-700">Total</td>
                        <td className="py-4 px-4 text-center text-gray-900">{roDetail.totalBoxes}</td>
                        <td className="py-4 px-4 text-center text-blue-700">{totals.ddd}</td>
                        <td className="py-4 px-4 text-center text-purple-700">{totals.ljbb}</td>
                        <td className="py-4 px-4 text-center text-amber-700">{totals.mbb}</td>
                        <td className="py-4 px-4 text-center text-emerald-700">{totals.ubb}</td>
                      </tr>
                    );
                  })()}
                </tfoot>
              </table>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <Button
          onClick={() => router.push('/en/ro')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to RO List
        </Button>

        <div className="bg-gradient-to-br from-[#002A3A] to-[#003847] rounded-2xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00E273]/10 rounded-full -ml-24 -mb-24" />
          
          <div className="relative">
            <p className="text-xs opacity-80 font-mono mb-2">{roDetail.id}</p>
            <h1 className="text-4xl font-black mb-4">{roDetail.store}</h1>
            <div className="flex flex-wrap items-center gap-6 text-sm opacity-90">
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                {roDetail.totalArticles} articles
              </span>
              <span className="flex items-center gap-2">
                <Box className="w-4 h-4" />
                {roDetail.totalBoxes} boxes
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {roDetail.createdAt}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {roDetail.dddBoxes > 0 && (
                <span className="px-3 py-1.5 bg-blue-500/20 backdrop-blur-sm rounded-lg text-sm font-semibold border border-blue-400/30">
                  DDD: {roDetail.dddBoxes} boxes
                </span>
              )}
              {roDetail.ljbbBoxes > 0 && (
                <span className="px-3 py-1.5 bg-purple-500/20 backdrop-blur-sm rounded-lg text-sm font-semibold border border-purple-400/30">
                  LJBB: {roDetail.ljbbBoxes} boxes
                </span>
              )}
              {roDetail.mbbBoxes > 0 && (
                <span className="px-3 py-1.5 bg-amber-500/20 backdrop-blur-sm rounded-lg text-sm font-semibold border border-amber-400/30">
                  MBB: {roDetail.mbbBoxes} boxes
                </span>
              )}
              {roDetail.ubbBoxes > 0 && (
                <span className="px-3 py-1.5 bg-emerald-500/20 backdrop-blur-sm rounded-lg text-sm font-semibold border border-emerald-400/30">
                  UBB: {roDetail.ubbBoxes} boxes
                </span>
              )}
            </div>
          </div>
        </div>

        {roDetail.currentStatus === 'DNPB_PROCESS' && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-6 mb-8 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <label className="block text-lg font-bold text-amber-900 mb-2">
                  DNPB Number Required
                </label>
                <Input
                  type="text"
                  placeholder="DNPB/DDD/WHS/2026/I/001"
                  value={dnpbInput}
                  onChange={(e) => setDnpbInput(e.target.value)}
                  className="border-amber-300 focus:border-amber-500 focus:ring-amber-500 bg-white"
                />
                {roDetail.dnpbNumber && (
                  <p className="mt-2 text-sm text-amber-700">Current: <span className="font-mono font-semibold">{roDetail.dnpbNumber}</span></p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#002A3A] to-[#00E273] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Order Progress
          </h2>
          
          <div className="space-y-0">
            {statusFlow.map((status, index) => {
              const Icon = status.icon;
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;
              
              return (
                <div key={status.id} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        isCompleted 
                          ? isCurrent 
                            ? "bg-gradient-to-br from-[#00E273] to-[#00B85E] shadow-lg shadow-[#00E273]/30 scale-110" 
                            : "bg-gradient-to-br from-[#002A3A] to-[#003847] shadow-md"
                          : "bg-gray-100"
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                    </div>
                    {index < statusFlow.length - 1 && (
                      <div 
                        className={`w-1 h-16 my-2 rounded-full transition-all duration-300 ${
                          index < currentStatusIndex ? "bg-gradient-to-b from-[#002A3A] to-[#00E273]" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                  
                  <div className={`pb-12 ${index === statusFlow.length - 1 ? 'pb-0' : ''}`}>
                    <p className={`text-lg font-bold mb-1 ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {status.label}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">{status.description}</p>
                    
                    {isCurrent && (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#00E273]/10 to-[#00B85E]/10 text-[#00E273] text-sm rounded-lg font-semibold border border-[#00E273]/20">
                        <div className="w-2 h-2 rounded-full bg-[#00E273] animate-pulse" />
                        Current Status
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4">
          <Button 
            onClick={() => setViewArticles(true)}
            variant="outline"
            className="flex-1 h-14 text-base border-2 border-gray-200 hover:border-[#002A3A] hover:bg-gray-50"
          >
            <Package className="w-5 h-5 mr-2" />
            View Articles
          </Button>
          <Button 
            onClick={handleAdvanceStatus}
            disabled={isUpdating || currentStatusIndex >= statusFlow.length - 1}
            className="flex-1 h-14 text-base bg-gradient-to-r from-[#00E273] to-[#00B85E] hover:from-[#00B85E] hover:to-[#00E273] text-white shadow-lg shadow-[#00E273]/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <>
                Next Stage
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
