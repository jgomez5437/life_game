'use client';

import { usePlayerStore } from '@/features/player/usePlayerStore';
import { INDUSTRIES, SUPPLIERS } from '@/lib/constants';
import { incorporateBusinessAction } from '@/features/business/actions/businessActions';
import { formatMoney } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/features/ui/useUIStore';
import { useState } from 'react';

export default function CreateBusinessPage() {
  const router = useRouter();
  const player = usePlayerStore();

  const [companyName, setCompanyName] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<keyof typeof INDUSTRIES | ''>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');

  const indKeys = Object.keys(INDUSTRIES) as Array<keyof typeof INDUSTRIES>;

  const handleIncorporate = () => {
    if (!companyName || !selectedIndustry || !selectedSupplier) {
      useUIStore.getState().showAlert("Please fill out all fields.");
      return;
    }

    const res = incorporateBusinessAction(companyName, selectedIndustry, selectedSupplier);
    if (res.success) {
      router.push('/game/business');
    } else {
      useUIStore.getState().showAlert(res.message);
    }
  };

  const selectedIndData = selectedIndustry ? INDUSTRIES[selectedIndustry] : null;

  return (
    <main className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col w-full max-w-lg mx-auto shadow-2xl border-x border-[#212b45] relative overflow-hidden">
      <header className="flex items-center p-4 bg-[#111727]/80 backdrop-blur-xl border-b border-[#212b45] z-10 shadow-lg">
        <button onClick={() => router.push('/game/work')} className="text-blue-400 hover:text-blue-300 transition-colors mr-4">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Incorporate</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col pb-32 space-y-6">
        <div className="text-center mt-4 mb-2">
          <div className="w-20 h-20 rounded-full bg-blue-900/30 flex items-center justify-center border-4 border-blue-900/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] mx-auto mb-4 text-blue-400">
            <i className="fas fa-city text-3xl drop-shadow-md"></i>
          </div>
          <h2 className="text-2xl font-bold text-white">Start a Company</h2>
          <p className="text-slate-400 text-sm mt-2">Become your own boss.</p>
          <div className="text-emerald-400 font-bold text-sm mt-2">Available Funds: {formatMoney(player.money)}</div>
        </div>

        {/* Company Name */}
        <div className="bg-[#111727] p-5 rounded-xl border border-[#212b45] shadow-lg">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Company Name</label>
          <input 
            type="text" 
            placeholder="e.g., Cyberdyne Systems"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            className="w-full bg-[#0a0f1c] text-white border border-[#2b3a5b] rounded-lg p-3 outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Industry Selection */}
        <div className="bg-[#111727] p-5 rounded-xl border border-[#212b45] shadow-lg">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Select Industry</label>
          <div className="space-y-3">
            {indKeys.map(key => {
              const ind = INDUSTRIES[key];
              const isSelected = selectedIndustry === key;
              const canAfford = player.money >= ind.startupCost;

              return (
                <div 
                  key={key} 
                  onClick={() => canAfford && setSelectedIndustry(key)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : canAfford ? 'bg-[#131b2f] border-[#2b3a5b] hover:bg-[#1b253c]' : 'bg-[#1b253c]/50 border-[#2b3a5b] opacity-50 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-blue-900 text-blue-400' : 'bg-[#0a0f1c] text-slate-400'}`}>
                      <i className={`fas ${ind.icon} text-lg`}></i>
                    </div>
                    <div>
                      <h3 className={`font-bold ${isSelected ? 'text-blue-300' : 'text-white'}`}>{ind.name}</h3>
                      <div className="text-xs text-slate-400">{ind.description}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${canAfford ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatMoney(ind.startupCost)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Supplier Selection */}
        <div className="bg-[#111727] p-5 rounded-xl border border-[#212b45] shadow-lg">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Select Supplier</label>
          <div className="space-y-3">
            {SUPPLIERS.map(sup => {
              const isSelected = selectedSupplier === sup.id;
              
              // Preview Cost
              let costPreview = "---";
              if (selectedIndData) {
                const cost = selectedIndData.unitCost * sup.costMod;
                costPreview = `${formatMoney(cost)}/unit`;
              }

              return (
                <div 
                  key={sup.id} 
                  onClick={() => setSelectedSupplier(sup.id)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-[#131b2f] border-[#2b3a5b] hover:bg-[#1b253c]'}`}
                >
                  <div>
                    <h3 className={`font-bold ${isSelected ? 'text-blue-300' : 'text-white'}`}>{sup.name} Quality</h3>
                    <div className="text-xs text-slate-400 mt-1">Quality: {sup.quality}% • Risk: {sup.risk * 100}%</div>
                  </div>
                  <div className="text-amber-400 font-bold text-sm">
                    {costPreview}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button 
          onClick={handleIncorporate}
          disabled={!companyName || !selectedIndustry || !selectedSupplier}
          className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 disabled:from-[#1b253c] disabled:to-[#1b253c] disabled:text-slate-500 rounded-xl font-bold text-white transition-all shadow-lg border border-blue-500/50"
        >
          Incorporate Business
        </button>
      </div>
    </main>
  );
}
