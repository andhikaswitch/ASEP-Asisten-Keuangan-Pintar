import React from 'react';
import { Transaction } from '../types';
import { Download, FileText } from 'lucide-react';

export function ReportView({ transactions, onExport }: { transactions: Transaction[], onExport: () => void }) {
  const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 border-r border-slate-700 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <FileText className="text-blue-500" />
            Laporan Keuangan
          </h1>
          <p className="text-slate-400 mt-1">Nih bos, rincian semua duit yang keluar masuk.</p>
        </div>
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
        >
          <Download size={18} />
          <span>Export Excel</span>
        </button>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-800 text-slate-400 border-b border-slate-700">
            <tr>
              <th className="px-6 py-4 font-medium">Tanggal</th>
              <th className="px-6 py-4 font-medium">Kategori</th>
              <th className="px-6 py-4 font-medium">Deskripsi</th>
              <th className="px-6 py-4 font-medium text-right">Pemasukan</th>
              <th className="px-6 py-4 font-medium text-right">Pengeluaran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                  Belum ada transaksi bos. Kasian amat.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 text-slate-300">{t.date}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{t.description}</td>
                  <td className="px-6 py-4 text-right font-medium text-emerald-400">
                    {t.income > 0 ? formatRupiah(t.income) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-rose-400">
                    {t.expense > 0 ? formatRupiah(t.expense) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
