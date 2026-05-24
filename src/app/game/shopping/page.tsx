'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/features/ui/useUIStore';

export default function ShoppingHubPage() {
  const router = useRouter();

  return (
    <main className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col w-full max-w-lg mx-auto shadow-2xl border-x border-[#212b45] relative overflow-hidden">
      <header className="flex items-center p-4 bg-[#111727]/80 backdrop-blur-xl border-b border-[#212b45] z-10 shadow-lg">
        <button onClick={() => router.push('/game/assets')} className="text-cyan-400 hover:text-cyan-300 transition-colors mr-4">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Marketplace</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        <div className="text-center mb-8 mt-4">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 mx-auto mb-4 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <i className="fas fa-shopping-bag text-3xl drop-shadow-md"></i>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">What are you buying?</h2>
          <p className="text-slate-400 text-sm mt-2">Spend your hard-earned money.</p>
        </div>

        <Link href="/game/shopping/vehicles" className="block bg-[#131b2f]/80 backdrop-blur-md p-6 rounded-2xl border border-[#2b3a5b] hover:border-cyan-500/50 transition-all group shadow-md hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-[#1b253c] flex items-center justify-center text-cyan-400 text-2xl group-hover:scale-110 transition-transform shadow-inner border border-[#374b75]">
              <i className="fas fa-car drop-shadow-md"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg group-hover:text-cyan-300 transition-colors">Car Dealership</h3>
              <div className="text-sm text-slate-400 font-medium">Buy transportation</div>
            </div>
            <i className="fas fa-chevron-right text-slate-600 group-hover:text-cyan-400 transition-colors text-lg"></i>
          </div>
        </Link>

        <button onClick={() => useUIStore.getState().showAlert("Coming Soon!")} className="w-full text-left bg-[#131b2f]/80 backdrop-blur-md p-6 rounded-2xl border border-[#2b3a5b] hover:border-emerald-500/50 transition-all group shadow-md hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-[#1b253c] flex items-center justify-center text-emerald-400 text-2xl group-hover:scale-110 transition-transform shadow-inner border border-[#374b75]">
              <i className="fas fa-home drop-shadow-md"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg group-hover:text-emerald-300 transition-colors">Real Estate</h3>
              <div className="text-sm text-slate-400 font-medium">Buy houses & condos</div>
            </div>
            <i className="fas fa-chevron-right text-slate-600 group-hover:text-emerald-400 transition-colors text-lg"></i>
          </div>
        </button>

        <button onClick={() => useUIStore.getState().showAlert("Coming Soon!")} className="w-full text-left bg-[#131b2f]/80 backdrop-blur-md p-6 rounded-2xl border border-[#2b3a5b] hover:border-fuchsia-500/50 transition-all group shadow-md hover:shadow-[0_0_20px_rgba(217,70,239,0.15)]">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-[#1b253c] flex items-center justify-center text-fuchsia-400 text-2xl group-hover:scale-110 transition-transform shadow-inner border border-[#374b75]">
              <i className="fas fa-gem drop-shadow-md"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-white text-lg group-hover:text-fuchsia-300 transition-colors">Luxury Goods</h3>
              <div className="text-sm text-slate-400 font-medium">Watches, jewelry, art</div>
            </div>
            <i className="fas fa-chevron-right text-slate-600 group-hover:text-fuchsia-400 transition-colors text-lg"></i>
          </div>
        </button>
      </div>
    </main>
  );
}
