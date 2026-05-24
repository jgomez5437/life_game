'use client';

import { usePlayerStore } from '@/features/player/usePlayerStore';
import { INDUSTRIES, SUPPLIERS } from '@/lib/constants';
import { updateBusinessSettingsAction, sellBusinessAction } from '@/features/business/actions/businessActions';
import { formatMoney } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/features/ui/useUIStore';
import { useState, useEffect } from 'react';

export default function BusinessDashboardPage() {
  const router = useRouter();
  const player = usePlayerStore();
  const b = player.business;

  const [price, setPrice] = useState(0);
  const [marketing, setMarketing] = useState(0);
  const [pay, setPay] = useState(0);
  const [ceoSalary, setCeoSalary] = useState(0);

  useEffect(() => {
    if (b) {
      setPrice(b.productPrice);
      setMarketing(b.marketingBudget);
      setPay(b.employeePay);
      setCeoSalary(player.ceoSalary);
    }
  }, [b, player.ceoSalary]);

  if (!player.hasBusiness || !b) {
    if (typeof window !== 'undefined') router.push('/game/work');
    return null;
  }

  const ind = INDUSTRIES[b.industry as keyof typeof INDUSTRIES];
  const sup = SUPPLIERS.find(s => s.id === b.supplier)!;

  const handleSave = () => {
    const res = updateBusinessSettingsAction(price, marketing, pay, ceoSalary);
    if (res.success) {
      useUIStore.getState().showAlert("Settings saved. Changes will take effect next year.");
    }
  };

  const handleSell = () => {
    useUIStore.getState().showConfirm(`Are you sure you want to sell ${player.companyName}?`, () => {
      const res = sellBusinessAction();
      if (res.success) {
        router.push('/game/work');
      }
    });
  };

  return (
    <main className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col w-full max-w-lg mx-auto shadow-2xl border-x border-[#212b45] relative overflow-hidden">
      <header className="flex items-center p-4 bg-[#111727]/80 backdrop-blur-xl border-b border-[#212b45] z-10 shadow-lg">
        <button onClick={() => router.push('/game/work')} className="text-blue-400 hover:text-blue-300 transition-colors mr-4">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">CEO Dashboard</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col pb-32 space-y-5">
        <div className="text-center mt-2 mb-4">
          <div className="w-20 h-20 rounded-full bg-blue-900/30 flex items-center justify-center border-4 border-[#2b3a5b] shadow-[0_0_30px_rgba(59,130,246,0.15)] mx-auto mb-3 text-blue-400">
            <i className={`fas ${ind.icon} text-3xl drop-shadow-md`}></i>
          </div>
          <h2 className="text-2xl font-bold text-white">{player.companyName}</h2>
          <p className="text-slate-400 text-sm mt-1">{ind.name} • {sup.name} Quality</p>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111727] p-4 rounded-xl border border-[#212b45] shadow-sm">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Company Cash</div>
            <div className="text-emerald-400 font-bold text-lg">{formatMoney(b.cash)}</div>
          </div>
          <div className="bg-[#111727] p-4 rounded-xl border border-[#212b45] shadow-sm">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Customers</div>
            <div className="text-blue-400 font-bold text-lg">{b.customers.toLocaleString()}</div>
          </div>
          <div className="bg-[#111727] p-4 rounded-xl border border-[#212b45] shadow-sm">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Last Year Rev</div>
            <div className="text-emerald-400 font-bold text-lg">{formatMoney(b.revenue)}</div>
          </div>
          <div className="bg-[#111727] p-4 rounded-xl border border-[#212b45] shadow-sm">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Last Year Exp</div>
            <div className="text-rose-400 font-bold text-lg">{formatMoney(b.expenses)}</div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-[#111727] p-5 rounded-xl border border-[#212b45] shadow-lg space-y-6">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <i className="fas fa-sliders-h text-blue-400"></i> Operations
          </h3>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Product Price</label>
              <span className="text-emerald-400 font-bold text-sm">{formatMoney(price)}</span>
            </div>
            <input 
              type="range" min={ind.unitPrice * 0.5} max={ind.unitPrice * 3} step={1}
              value={price} onChange={e => setPrice(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Marketing Budget</label>
              <span className="text-amber-400 font-bold text-sm">{formatMoney(marketing)}</span>
            </div>
            <input 
              type="range" min={0} max={100000} step={1000}
              value={marketing} onChange={e => setMarketing(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Employee Pay</label>
              <span className="text-blue-400 font-bold text-sm">{formatMoney(pay)}</span>
            </div>
            <input 
              type="range" min={ind.baseSalary * 0.5} max={ind.baseSalary * 2} step={500}
              value={pay} onChange={e => setPay(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">CEO Salary (You)</label>
              <span className="text-emerald-400 font-bold text-sm">{formatMoney(ceoSalary)}</span>
            </div>
            <input 
              type="range" min={0} max={1000000} step={5000}
              value={ceoSalary} onChange={e => setCeoSalary(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white transition-colors shadow-md mt-4"
          >
            Save Settings
          </button>
        </div>

        {/* Sell Business */}
        <button 
          onClick={handleSell}
          className="w-full p-4 rounded-xl border bg-rose-900/20 border-rose-800/50 hover:bg-rose-900/40 hover:border-rose-500/50 transition-all shadow-md flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-rose-400 shadow-inner">
              <i className="fas fa-handshake text-lg"></i>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-white text-base group-hover:text-rose-300 transition-colors">Sell Company</h3>
              <div className="text-xs text-rose-300/70 font-medium">Exit your business</div>
            </div>
          </div>
        </button>

      </div>
    </main>
  );
}
