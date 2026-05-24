'use client';

import { usePlayerStore } from '@/features/player/usePlayerStore';
import { VEHICLES_FOR_SALE } from '@/lib/constants';
import { buyVehicleAction } from '@/features/assets/actions/buyVehicle';
import { formatMoney } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/features/ui/useUIStore';

export default function VehicleDealershipPage() {
  const router = useRouter();
  const player = usePlayerStore();

  const getVehicleIcon = (type: string) => {
    if (type === 'truck') return { icon: 'fa-truck', color: 'text-orange-400' };
    if (type === 'suv') return { icon: 'fa-truck-pickup', color: 'text-emerald-400' };
    if (type === 'sports' || type === 'supercar') return { icon: 'fa-car-side', color: 'text-rose-400' };
    return { icon: 'fa-car', color: 'text-blue-400' };
  };

  const handleBuy = (carId: number) => {
    const res = buyVehicleAction(carId);
    if (res.success) {
      router.push('/game/assets');
    } else {
      useUIStore.getState().showAlert(res.message);
    }
  };

  return (
    <main className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col w-full max-w-lg mx-auto shadow-2xl border-x border-[#212b45] relative overflow-hidden">
      <header className="flex items-center p-4 bg-[#111727]/80 backdrop-blur-xl border-b border-[#212b45] z-10 shadow-lg">
        <button onClick={() => router.push('/game/shopping')} className="text-cyan-400 hover:text-cyan-300 transition-colors mr-4">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Vehicle Dealership</h1>
        <div className="ml-auto bg-[#18233a] px-3 py-1 rounded-lg border border-[#2b3a5b] flex items-center gap-2">
          <i className="fas fa-wallet text-emerald-400 text-xs"></i>
          <span className="font-bold text-sm text-emerald-400">{formatMoney(player.money)}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        <div className="text-center mb-6 mt-2">
          <div className="w-16 h-16 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 mx-auto mb-3 text-2xl shadow-inner border border-cyan-500/20">
            <i className="fas fa-car drop-shadow-md"></i>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{player.city} Auto Sales</h2>
          <p className="text-slate-400 text-sm mt-1">Find your new ride.</p>
        </div>

        {VEHICLES_FOR_SALE.map(car => {
          const canAfford = player.money >= car.price;
          const style = getVehicleIcon(car.type);

          return (
            <div key={car.id} className="bg-[#131b2f]/80 backdrop-blur-md p-4 rounded-xl border border-[#2b3a5b] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1b253c] flex items-center justify-center border border-[#374b75] shadow-inner shrink-0">
                  <i className={`fas ${style.icon} ${style.color} text-xl drop-shadow-md`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-none mb-1.5">{car.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-400 capitalize border-r border-[#374b75] pr-2 font-medium uppercase tracking-widest">{car.type}</div>
                    <div className="text-emerald-400 font-bold text-xs">{formatMoney(car.price)}</div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleBuy(car.id)}
                disabled={!canAfford}
                className={`ml-3 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-md whitespace-nowrap ${canAfford ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-[#1b253c] text-slate-500 cursor-not-allowed opacity-70'}`}
              >
                {canAfford ? 'Buy' : 'Too Expensive'}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
