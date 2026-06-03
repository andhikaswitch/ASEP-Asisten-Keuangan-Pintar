import React from 'react';
import { Transaction } from '../types';
import { Coffee, Receipt } from 'lucide-react';

export function BillsView({ transactions }: { transactions: Transaction[] }) {
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const bills = transactions.filter(t => 
    t.category === 'Tagihan' || 
    t.category === 'Makan dan Minum' || 
    t.category === 'Hiburan' || 
    t.category === 'Belanja'
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 border-r border-slate-700 p-8 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Coffee className="text-rose-500" />
          Tagihan & Jajan
        </h1>
        <p className="text-slate-400 mt-1">Daftar pengeluaran hedon sama kewajiban lo bulan ini bos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bills.length === 0 ? (
          <div className="col-span-full p-8 border border-dashed border-slate-700 rounded-xl text-center text-slate-500 italic">
            Belum ada jajan atau tagihan. Tumben hemat?
          </div>
        ) : (
          bills.map(t => (
            <div key={t.id} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex flex-col gap-3 hover:bg-slate-800 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                    <Receipt className="text-rose-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-200">{t.description}</h3>
                    <p className="text-xs text-slate-400 mt-1">{t.date}</p>
                  </div>
                </div>
                <span className="font-bold text-rose-400">{formatRupiah(t.expense)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                <span className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400 border border-slate-700">
                  {t.category}
                </span>
                <span className="text-xs text-slate-500 italic">Sudah dicatat Asep</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
