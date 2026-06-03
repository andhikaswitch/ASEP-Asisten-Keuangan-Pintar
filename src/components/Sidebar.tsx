import React from 'react';
import { Coins, Coffee, MessageSquare, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            {/* Simple logo mimicking Gintoki's hair color / vibe */}
            <span className="text-blue-900 font-bold font-serif italic text-xl">銀</span>
          </div>
          <span className="font-bold text-slate-200 tracking-wide">Asep</span>
        </div>
      </div>

      <nav className="flex-1 pt-6 px-3 space-y-1 overflow-y-auto">
        <NavItem active={activeTab === 'chat'} onClick={() => onTabChange('chat')} icon={<MessageSquare size={18} />} label="Obrolan Bos" />
        <NavItem active={activeTab === 'report'} onClick={() => onTabChange('report')} icon={<Coins size={18} />} label="Laporan Keuangan" />
      </nav>

      <div className="p-4 m-4 bg-slate-800 rounded-xl border border-slate-700 relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/5 -translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Asep's Mood Today</p>
        <p className="text-sm text-slate-300 italic">"Ngoceh mulu. Bagi Extra Joss napa Bos, badan pegel abis push rank semaleman nih."</p>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
      active 
        ? "bg-blue-600/10 text-blue-400" 
        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    )}>
      {icon}
      {label}
    </button>
  );
}
