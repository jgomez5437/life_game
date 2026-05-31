'use client';

import { usePlayerStore } from '@/features/player/usePlayerStore';
import { formatMoney } from '@/lib/utils';
import { sellVehicleAction } from '@/features/assets/actions/sellVehicle';
import { repairVehicleAction } from '@/features/assets/actions/repairVehicle';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/features/ui/useUIStore';
import { useState } from 'react';

export default function AssetsPage() {
  const router = useRouter();
  const player = usePlayerStore();
  const [managingVehicleId, setManagingVehicleId] = useState<string | null>(null);

  // --- CALCULATE STATS ---
  let monthlyIncome = 0;
  if (player.hasBusiness) monthlyIncome += player.ceoSalary;
  if (player.jobTitle) monthlyIncome += Math.floor((player.jobSalary || 0) / 12);

  let monthlyOutflow = 0;
  if (player.studentLoans > 0 && player.age >= 23 && !player.gradSchoolEnrolled) {
    monthlyOutflow += 200;
  }
  if (player.age >= 19 && !player.isStudent) {
    monthlyOutflow += 2000;
  }

  const vehicles = player.assets.filter(a => a.category === 'vehicle');

  const getVehicleIcon = (type: string) => {
    if (type === 'truck') return { icon: 'fa-truck', color: 'text-orange-400' };
    if (type === 'suv') return { icon: 'fa-truck-pickup', color: 'text-emerald-400' };
    if (type === 'sports' || type === 'supercar') return { icon: 'fa-car-side', color: 'text-rose-400' };
    return { icon: 'fa-car', color: 'text-blue-400' };
  };

  const selectedVehicle = vehicles.find(v => v.id === managingVehicleId);

  return (
    <main className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col w-full max-w-lg mx-auto shadow-2xl border-x border-[#212b45] relative overflow-hidden">
      {/* HEADER */}
      <header className="flex items-center p-4 bg-[#111727]/80 backdrop-blur-xl border-b border-[#212b45] z-10 shadow-lg">
        <button onClick={() => router.push('/game')} className="text-cyan-400 hover:text-cyan-300 transition-colors mr-4">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">My Assets</h1>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        
        {/* STATS */}
        <div className="bg-[#111727]/90 p-4 rounded-xl border border-[#212b45] grid grid-cols-3 gap-2 text-center shadow-md">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Income</div>
            <div className="text-emerald-400 font-bold text-sm">{formatMoney(monthlyIncome)}/mo</div>
          </div>
          <div className="border-x border-[#2b3a5b] px-2">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Student Loans</div>
            <div className="text-rose-400 font-bold text-sm">{formatMoney(player.studentLoans)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Monthly Outflow</div>
            <div className="text-rose-400 font-bold text-sm">{formatMoney(monthlyOutflow)}/mo</div>
          </div>
        </div>
        
        {/* SHOPPING HUB LINK */}
        <Link href="/game/shopping" className="block bg-gradient-to-r from-[#1b253c] to-[#111727] p-4 rounded-xl border border-[#2b3a5b] cursor-pointer hover:border-cyan-500/50 transition-all shadow-md group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <h3 className="font-bold text-white text-lg">Go Shopping</h3>
          </div>
          <div className="bg-[#0a0f1c] p-3 rounded-lg border border-[#1e2944] flex justify-between items-center">
            <div className="text-sm text-slate-300 font-medium">Buy Vehicles & Property</div>
            <i className="fas fa-chevron-right text-slate-600 group-hover:text-cyan-400 transition-colors"></i>
          </div>
        </Link>

        {/* VEHICLES */}
        <div>
          <h3 className="text-slate-400 font-bold mb-3 text-xs uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-car text-cyan-400"></i> Vehicles
          </h3>
          
          {vehicles.length === 0 ? (
            <div className="bg-[#111727]/50 p-4 rounded-xl border border-dashed border-[#2b3a5b] text-slate-500 italic text-sm text-center">
              You don't own any vehicles.
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map(v => {
                const style = getVehicleIcon(v.type || '');
                let condColor = 'text-emerald-400';
                if (v.condition < 40) condColor = 'text-rose-500'; 
                else if (v.condition < 75) condColor = 'text-amber-500'; 
                
                return (
                  <div key={v.id} onClick={() => setManagingVehicleId(v.id)} className="cursor-pointer bg-[#131b2f]/80 backdrop-blur-md p-4 rounded-xl border border-[#2b3a5b] hover:border-cyan-500/50 transition-all flex items-center justify-between group shadow-sm hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#1b253c] flex items-center justify-center border border-[#374b75] shadow-inner group-hover:bg-[#1e2944] transition-colors">
                        <i className={`fas ${style.icon} ${style.color} text-xl drop-shadow-md`}></i>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">{v.name}</h4>
                        <div className="text-xs text-slate-400 capitalize font-medium mt-0.5">
                          {v.type} • <span className={condColor}>{v.condition}% Cond.</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold text-sm tracking-wide">{formatMoney(v.value)}</div>
                      <i className="fas fa-chevron-right text-slate-600 text-xs mt-1 group-hover:text-cyan-400 transition-colors"></i>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COMING SOON SECTIONS */}
        <div>
          <h3 className="text-slate-400 font-bold mb-3 text-xs uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-home text-emerald-400"></i> Properties
          </h3>
          <div className="bg-[#111727]/50 p-4 rounded-xl border border-[#2b3a5b] text-slate-500 italic text-sm text-center">
            Coming Soon
          </div>
        </div>

        <div>
          <h3 className="text-slate-400 font-bold mb-3 text-xs uppercase tracking-widest flex items-center gap-2">
            <i className="fas fa-chart-line text-fuchsia-400"></i> Investments
          </h3>
          <div className="bg-[#111727]/50 p-4 rounded-xl border border-[#2b3a5b] text-slate-500 italic text-sm text-center">
            Coming Soon
          </div>
        </div>

      </div>

      {/* MANAGING VEHICLE MODAL */}
      {selectedVehicle && (
        <div className="absolute inset-0 z-50 bg-[#080b12]/95 backdrop-blur-xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <header className="flex items-center p-4 bg-transparent border-b border-[#212b45]">
            <button onClick={() => setManagingVehicleId(null)} className="text-cyan-400 hover:text-cyan-300 transition-colors mr-4">
              <i className="fas fa-arrow-left text-xl"></i>
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Manage Vehicle</h1>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            <div className="text-center mb-8 mt-4">
              <div className="w-24 h-24 rounded-full bg-[#1b253c] flex items-center justify-center border-4 border-[#2b3a5b] shadow-[0_0_30px_rgba(34,211,238,0.15)] mx-auto mb-4">
                <i className={`fas ${getVehicleIcon(selectedVehicle.type || '').icon} ${getVehicleIcon(selectedVehicle.type || '').color} text-4xl drop-shadow-md`}></i>
              </div>
              <h2 className="text-2xl font-bold text-white">{selectedVehicle.name}</h2>
              <div className="text-emerald-400 font-black text-2xl mt-1 tracking-tight">{formatMoney(selectedVehicle.value)}</div>
              <p className="text-slate-400 text-sm capitalize font-medium uppercase tracking-widest mt-2">{selectedVehicle.type}</p>
            </div>

            <div className="bg-[#111727] p-6 rounded-2xl border border-[#212b45] mb-6 shadow-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Condition</span>
                <span className={`${selectedVehicle.condition < 50 ? 'text-rose-400' : 'text-emerald-400'} font-bold`}>{selectedVehicle.condition}%</span>
              </div>
              <div className="w-full bg-[#0a0f1c] h-3 rounded-full overflow-hidden border border-[#2b3a5b]/50 shadow-inner">
                <div className={`h-full ${selectedVehicle.condition < 50 ? 'bg-rose-500' : 'bg-emerald-500'} transition-all duration-500`} style={{ width: `${selectedVehicle.condition}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center font-medium">
                {selectedVehicle.condition < 40 ? "This car is a rust bucket. Repair it soon!" : "Vehicle is running smoothly."}
              </p>
            </div>

            <div className="mt-auto space-y-3 pb-8">
              {(() => {
                const damage = 100 - selectedVehicle.condition;
                const baseRepairCost = damage * 20; 
                const luxuryMultiplier = Math.max(1, selectedVehicle.value / 20000);
                const repairCost = Math.floor(baseRepairCost * luxuryMultiplier);
                const canRepair = player.money >= repairCost && selectedVehicle.condition < 100;

                return (
                  <button 
                    onClick={() => {
                      if (canRepair) {
                        const res = repairVehicleAction(selectedVehicle.id, repairCost);
                        if (res.success) setManagingVehicleId(null);
                      }
                    }}
                    disabled={!canRepair}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all shadow-md group ${canRepair ? 'bg-cyan-900/30 border-cyan-500/50 hover:bg-cyan-900/50' : 'bg-[#1b253c]/50 border-[#2b3a5b] opacity-50 cursor-not-allowed'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-cyan-400 shadow-inner">
                        <i className="fas fa-wrench text-lg"></i>
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-white text-base">Repair Vehicle</h3>
                        <div className="text-xs text-cyan-200 font-medium">Cost: {formatMoney(repairCost)}</div>
                      </div>
                    </div>
                    {canRepair && <i className="fas fa-chevron-right text-cyan-600 group-hover:text-cyan-400 transition-colors"></i>}
                  </button>
                );
              })()}

              <button 
                onClick={() => {
                  useUIStore.getState().showConfirm(`Are you sure you want to sell your ${selectedVehicle.name} for ${formatMoney(selectedVehicle.value)}?`, () => {
                    const res = sellVehicleAction(selectedVehicle.id);
                    if (res.success) setManagingVehicleId(null);
                  });
                }}
                className="w-full p-4 rounded-xl border bg-rose-900/20 border-rose-800/50 hover:bg-rose-900/40 hover:border-rose-500/50 transition-all shadow-md flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-rose-400 shadow-inner">
                    <i className="fas fa-dollar-sign text-lg"></i>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-white text-base group-hover:text-rose-300 transition-colors">Sell Vehicle</h3>
                    <div className="text-xs text-rose-300/70 font-medium">Sell for market value</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
