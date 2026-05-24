'use client';

import { usePlayerStore } from '@/features/player/usePlayerStore';
import { PART_TIME_JOBS } from '@/lib/constants';
import { applyForJobAction } from '@/features/work/actions/jobActions';
import { formatMoney } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/features/ui/useUIStore';
import { useState } from 'react';

export default function PartTimeMarketPage() {
  const router = useRouter();
  const player = usePlayerStore();
  const [applying, setApplying] = useState(false);

  const handleApply = (job: typeof PART_TIME_JOBS[0]) => {
    if (applying) return;
    setApplying(true);

    setTimeout(() => {
      const res = applyForJobAction(job.title, job.salary, false, null);
      if (res.success) {
        router.push('/game/work');
      } else {
        useUIStore.getState().showAlert(res.message);
        setApplying(false);
      }
    }, 500);
  };

  return (
    <main className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col w-full max-w-lg mx-auto shadow-2xl border-x border-[#212b45] relative overflow-hidden">
      <header className="flex items-center p-4 bg-[#111727]/80 backdrop-blur-xl border-b border-[#212b45] z-10 shadow-lg">
        <button onClick={() => router.push('/game/work')} className="text-amber-400 hover:text-amber-300 transition-colors mr-4">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Part-Time Jobs</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        <div className="text-center mb-6 mt-2">
          <div className="w-16 h-16 rounded-full bg-amber-900/30 flex items-center justify-center text-amber-400 mx-auto mb-3 text-2xl shadow-inner border border-amber-500/20">
            <i className="fas fa-clock drop-shadow-md"></i>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Job Listings</h2>
          <p className="text-slate-400 text-sm mt-1">Earn some extra cash.</p>
        </div>

        {PART_TIME_JOBS.map((job, idx) => {
          let reqColor = 'text-emerald-400';
          let reqText = 'Qualified';
          let isQualified = true;

          if (player.jobTitle === job.title) {
            reqColor = 'text-amber-400';
            reqText = 'Current Job';
            isQualified = false;
          }

          return (
            <div key={idx} className="bg-[#131b2f]/80 backdrop-blur-md p-4 rounded-xl border border-[#2b3a5b] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1b253c] flex items-center justify-center border border-[#374b75] shadow-inner shrink-0 text-slate-400">
                  <i className={`fas ${job.icon} text-xl drop-shadow-md`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-none mb-1.5">{job.title}</h3>
                  <div className="flex items-center gap-2">
                    <div className="text-emerald-400 font-bold text-xs border-r border-[#374b75] pr-2">${job.hourly}/hr</div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${reqColor}`}>{reqText}</div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleApply(job)}
                disabled={!isQualified || applying}
                className={`ml-3 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-md whitespace-nowrap ${isQualified ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-[#1b253c] text-slate-500 cursor-not-allowed opacity-70'}`}
              >
                Apply
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
