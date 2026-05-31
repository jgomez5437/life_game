'use client';

import { usePlayerStore } from '@/features/player/usePlayerStore';
import { quitJobAction, workHarderAction, slackOffAction } from '@/features/work/actions/jobActions';
import { formatMoney } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/features/ui/useUIStore';

export default function ManageJobPage() {
  const router = useRouter();
  const player = usePlayerStore();

  if (!player.jobTitle) {
    if (typeof window !== 'undefined') router.push('/game/work');
    return null;
  }

  const handleQuit = () => {
    useUIStore.getState().showConfirm(`Are you sure you want to quit your job as a ${player.jobTitle}?`, () => {
      const res = quitJobAction();
      if (res.success) {
        router.push('/game/work');
      } else {
        useUIStore.getState().showAlert(res.message);
      }
    });
  };

  return (
    <main className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col w-full max-w-lg mx-auto shadow-2xl border-x border-[#212b45] relative overflow-hidden">
      <header className="flex items-center p-4 bg-[#111727]/80 backdrop-blur-xl border-b border-[#212b45] z-10 shadow-lg">
        <button onClick={() => router.push('/game/work')} className="text-cyan-400 hover:text-cyan-300 transition-colors mr-4">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Manage Job</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col pb-32">
        <div className="text-center mb-8 mt-4">
          <div className="w-24 h-24 rounded-full bg-[#1b253c] flex items-center justify-center border-4 border-[#2b3a5b] shadow-[0_0_30px_rgba(34,211,238,0.15)] mx-auto mb-4 text-cyan-400">
            <i className="fas fa-briefcase text-4xl drop-shadow-md"></i>
          </div>
          <h2 className="text-2xl font-bold text-white">{player.jobTitle}</h2>
          <div className="text-emerald-400 font-black text-2xl mt-1 tracking-tight">{formatMoney(player.jobSalary || 0)}/yr</div>
        </div>

        <div className="bg-[#111727] p-6 rounded-2xl border border-[#212b45] mb-6 shadow-lg">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Performance</span>
            <span className={`${player.jobPerformance < 50 ? 'text-rose-400' : 'text-emerald-400'} font-bold`}>{player.jobPerformance}%</span>
          </div>
          <div className="w-full bg-[#0a0f1c] h-3 rounded-full overflow-hidden border border-[#2b3a5b]/50 shadow-inner">
            <div className={`h-full ${player.jobPerformance < 50 ? 'bg-rose-500' : 'bg-emerald-500'} transition-all duration-500`} style={{ width: `${player.jobPerformance}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center font-medium">
            {player.jobPerformance < 40 ? "Your boss is very unhappy. Work harder!" : "You are doing a great job."}
          </p>
        </div>

        <div className="mt-auto space-y-3">
          <button 
            onClick={() => {
              const res = workHarderAction();
              if (!res.success) useUIStore.getState().showAlert(res.message);
            }}
            className="w-full p-4 rounded-xl border bg-[#131b2f] border-[#2b3a5b] hover:bg-[#1b253c] hover:border-cyan-500/50 transition-all shadow-md flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-cyan-400 shadow-inner">
                <i className="fas fa-laptop-code text-lg"></i>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">Work Harder</h3>
                <div className="text-xs text-slate-400 font-medium">Increase performance this year</div>
              </div>
            </div>
            <i className="fas fa-chevron-right text-slate-600 group-hover:text-cyan-400 transition-colors"></i>
          </button>

          <button 
            onClick={() => {
              const res = slackOffAction();
              if (!res.success) useUIStore.getState().showAlert(res.message);
            }}
            className="w-full p-4 rounded-xl border bg-[#131b2f] border-[#2b3a5b] hover:bg-[#1b253c] hover:border-amber-500/50 transition-all shadow-md flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-amber-400 shadow-inner">
                <i className="fas fa-coffee text-lg"></i>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">Slack Off</h3>
                <div className="text-xs text-slate-400 font-medium">Take it easy (performance drops)</div>
              </div>
            </div>
            <i className="fas fa-chevron-right text-slate-600 group-hover:text-amber-400 transition-colors"></i>
          </button>

          <button 
            onClick={handleQuit}
            className="w-full p-4 rounded-xl border bg-rose-900/20 border-rose-800/50 hover:bg-rose-900/40 hover:border-rose-500/50 transition-all shadow-md flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-rose-400 shadow-inner">
                <i className="fas fa-door-open text-lg"></i>
              </div>
              <div className="text-left">
                <h3 className="font-bold text-white text-base group-hover:text-rose-300 transition-colors">Resign</h3>
                <div className="text-xs text-rose-300/70 font-medium">Quit this job immediately</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
