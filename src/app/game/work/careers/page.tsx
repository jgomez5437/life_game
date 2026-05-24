'use client';

import { usePlayerStore } from '@/features/player/usePlayerStore';
import { CAREERS } from '@/lib/constants';
import { applyForJobAction } from '@/features/work/actions/jobActions';
import { formatMoney } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/features/ui/useUIStore';
import { useState } from 'react';

export default function CareerMarketPage() {
  const router = useRouter();
  const player = usePlayerStore();
  const [applying, setApplying] = useState(false);

  const handleApply = (job: typeof CAREERS[0]) => {
    if (applying) return;
    setApplying(true);

    // Add a slight delay for dramatic effect
    setTimeout(() => {
      const res = applyForJobAction(job.title, job.salary, job.reqDegree, job.reqGrad);
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
        <button onClick={() => router.push('/game/work')} className="text-cyan-400 hover:text-cyan-300 transition-colors mr-4">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Careers Market</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        <div className="text-center mb-6 mt-2">
          <div className="w-16 h-16 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 mx-auto mb-3 text-2xl shadow-inner border border-cyan-500/20">
            <i className="fas fa-briefcase drop-shadow-md"></i>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Job Listings</h2>
          <p className="text-slate-400 text-sm mt-1">Start your professional career.</p>
        </div>

        {CAREERS.map((job, idx) => {
          // Determine if player meets requirements
          let reqColor = 'text-emerald-400';
          let reqText = 'Qualified';
          let isQualified = true;

          if (job.reqDegree && !player.universityGraduated) {
            reqColor = 'text-rose-400';
            reqText = 'Requires Univ. Degree';
            isQualified = false;
          } else if (job.reqGrad && player.gradSchoolDegree !== job.reqGrad) {
            reqColor = 'text-rose-400';
            reqText = `Requires ${job.reqGrad}`;
            isQualified = false;
          }

          if (player.jobTitle === job.title) {
            reqColor = 'text-cyan-400';
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
                    <div className="text-emerald-400 font-bold text-xs border-r border-[#374b75] pr-2">{formatMoney(job.salary)}/yr</div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${reqColor}`}>{reqText}</div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleApply(job)}
                disabled={!isQualified || applying}
                className={`ml-3 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-md whitespace-nowrap ${isQualified ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-[#1b253c] text-slate-500 cursor-not-allowed opacity-70'}`}
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
