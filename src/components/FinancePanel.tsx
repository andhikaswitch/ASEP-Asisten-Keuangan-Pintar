import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { Transaction } from '../types';

interface FinancePanelProps {
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    categoryTotals: Record<string, number>;
  };
  onExport: () => void;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

export function FinancePanel({ summary, onExport }: FinancePanelProps) {
  const data = Object.entries(summary.categoryTotals).map(([name, value], index) => ({
    name,
    value,
    color: COLORS[index % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-slate-100">Statistik Bos</h2>
        <button 
          onClick={onExport}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
          title="Download Excel"
        >
          <Download size={18} />
        </button>
      </div>

      <div className="space-y-4 mb-8">
        <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
          <p className="text-sm text-slate-400 mb-1">Saldo Bersih</p>
          <p className={cn("text-2xl font-bold", summary.balance >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {formatRupiah(summary.balance)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <p className="text-xs text-slate-400 mb-1">Pemasukan</p>
            <p className="text-sm font-semibold text-blue-400">{formatRupiah(summary.totalIncome)}</p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <p className="text-xs text-slate-400 mb-1">Pengeluaran</p>
            <p className="text-sm font-semibold text-rose-400">{formatRupiah(summary.totalExpense)}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[220px] flex flex-col">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 shrink-0">Pengeluaran Bulan Ini</h3>
        {data.length > 0 ? (
          <div className="h-48 w-full relative shrink-0 min-h-[192px] min-w-[200px]">
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatRupiah(value)}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm italic">
            Belum ada pengeluaran
          </div>
        )}

        <div className="mt-4 space-y-3">
          {data.map((item, i) => (
            <div key={i} className="flex flex-col">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="text-slate-400 font-medium">{formatRupiah(item.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
