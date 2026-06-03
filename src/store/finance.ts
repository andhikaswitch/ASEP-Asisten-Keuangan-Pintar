import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import * as xlsx from 'xlsx';

const STORAGE_KEY = 'asep_finance_data';

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTransactions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored transactions", e);
      }
    }
  }, []);

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    const newTransactions = [...transactions, newTransaction];
    setTransactions(newTransactions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTransactions));
    return newTransaction;
  };

  const getSummary = () => {
    const totalIncome = transactions.reduce((sum, t) => sum + (t.income || 0), 0);
    const totalExpense = transactions.reduce((sum, t) => sum + (t.expense || 0), 0);
    const balance = totalIncome - totalExpense;

    const categoryTotals = transactions.reduce((acc, t) => {
      if (t.expense > 0) {
        acc[t.category] = (acc[t.category] || 0) + t.expense;
      }
      return acc;
    }, {} as Record<string, number>);

    return { totalIncome, totalExpense, balance, categoryTotals };
  };

  const exportToExcel = () => {
    const currentMonth = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    const sheetName = `Laporan ${currentMonth}`.substring(0, 31);

    const data = transactions.map(t => ({
      Tanggal: t.date,
      Kategori: t.category,
      Deskripsi: t.description,
      Pemasukan: t.income,
      Pengeluaran: t.expense,
      Saldo: t.income - t.expense
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, sheetName);
    xlsx.writeFile(wb, 'keuangan_asep.xlsx');
  };

  return { transactions, addTransaction, getSummary, exportToExcel };
}
