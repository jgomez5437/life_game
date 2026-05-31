'use client';

import { usePlayerStore } from '@/features/player/usePlayerStore';
import { formatMoney } from '@/lib/utils';
import { PART_TIME_JOBS } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function WorkHubPage() {
  const router = useRouter();
  const player = usePlayerStore();

  const isAdult = player.age >= 18;
  const currentJobIsPartTime = PART_TIME_JOBS.some(j => j.title === player.jobTitle);
  const hasCareer = player.jobTitle && !currentJobIsPartTime;
  const hasPartTime = player.jobTitle && currentJobIsPartTime;

  const getSchoolName = () => {
    if (player.gradSchoolEnrolled) {
      return `${player.gradSchoolType} (Year ${player.gradSchoolYear + 1})`;
    }
    if (player.universityEnrolled) return `University of ${player.city}`;
    if (player.age < 12) return `${player.city} Elementary School`;
    if (player.age < 14) return `${player.city} Middle School`;
    return `${player.city} High School`;
  };

  return (
    <main className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col w-full max-w-lg mx-auto shadow-2xl border-x border-[#212b45] relative overflow-hidden">
      <header className="flex items-center p-4 bg-[#111727]/80 backdrop-blur-xl border-b border-[#212b45] z-10 shadow-lg">
        <button onClick={() => router.push('/game')} className="text-cyan-400 hover:text-cyan-300 transition-colors mr-4">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Occupation Manager</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-32">
        {/* STATUS CARD */}
        <div className="bg-[#111727]/90 p-4 rounded-xl border border-[#212b45] flex justify-between items-center shadow-md">
          <div>
            <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Current Status</h3>
            <div className="text-lg font-bold text-white tracking-tight">{player.lifeStatus}</div>
          </div>
          <div className="text-right">
            <h3 className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Residence</h3>
            <div className="text-sm font-bold text-white">{player.city}</div>
          </div>
        </div>

        {/* CEO ACTIONS */}
        {player.hasBusiness && (
          <div className="mb-6">
            <h3 className="text-white font-bold mb-2">My Company</h3>
            <button onClick={() => router.push('/game/business')} className="w-full bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-4 rounded-xl mb-2 flex items-center justify-between px-6 shadow-lg transition-all border border-blue-500/30">
              <span className="flex items-center gap-3"><i className="fas fa-building text-blue-300"></i> Manage {player.companyName}</span>
              <i className="fas fa-chevron-right text-blue-300"></i>
            </button>
          </div>
        )}

        {/* EDUCATION BLOCK */}
        <div>
          {player.gradSchoolDegree ? (
            <div className="bg-[#131b2f]/40 p-4 rounded-xl border border-dashed border-[#2b3a5b] opacity-70 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1b253c] flex items-center justify-center text-slate-500 border border-[#374b75]">
                  <i className="fas fa-user-graduate"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-300">Education Complete</h3>
                  <div className="text-xs text-slate-500">You have a terminal degree.</div>
                </div>
              </div>
              <i className="fas fa-check text-slate-500"></i>
            </div>
          ) : player.gradSchoolEnrolled ? (
            <Link href="/game/work/education" className="block bg-[#131b2f]/80 p-4 rounded-xl border border-[#2b3a5b] hover:border-fuchsia-500/50 transition-all group shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/20">
                    <i className="fas fa-university"></i>
                  </div>
                  <h3 className="font-bold text-white">{player.gradSchoolType}</h3>
                </div>
                <div className={`px-2 py-1 rounded bg-[#0a0f1c] text-xs font-bold border ${player.schoolPerformance > 75 ? 'text-emerald-400 border-emerald-900/50' : 'text-amber-400 border-amber-900/50'}`}>
                  {player.schoolPerformance}%
                </div>
              </div>
              <div className="bg-[#0a0f1c] p-3 rounded-lg border border-[#1e2944] flex justify-between items-center">
                <div>
                  <div className="text-sm text-white font-bold">Year {player.gradSchoolYear + 1}</div>
                  <div className="text-xs text-fuchsia-400 font-medium uppercase tracking-widest mt-0.5">Enrolled</div>
                </div>
                <i className="fas fa-chevron-right text-slate-600 group-hover:text-fuchsia-400 transition-colors"></i>
              </div>
            </Link>
          ) : player.universityGraduated ? (
            <Link href="/game/work/education" className="block bg-[#131b2f]/80 p-4 rounded-xl border border-[#2b3a5b] hover:border-fuchsia-500/50 transition-all group shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#1b253c] flex items-center justify-center text-slate-400 border border-[#374b75]">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <h3 className="font-bold text-white">Graduate School</h3>
              </div>
              <div className="bg-[#0a0f1c] p-3 rounded-lg border border-[#1e2944] flex justify-between items-center">
                <div className="text-sm text-white font-bold">Enroll in Program</div>
                <i className="fas fa-chevron-right text-slate-600 group-hover:text-fuchsia-400 transition-colors"></i>
              </div>
            </Link>
          ) : player.age < 5 ? (
            <div className="bg-[#131b2f]/40 p-4 rounded-xl border border-dashed border-[#2b3a5b] opacity-70 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1b253c] flex items-center justify-center text-slate-500 border border-[#374b75]">
                  <i className="fas fa-school"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-300">School</h3>
                  <div className="text-xs text-slate-500">Available at Age 5</div>
                </div>
              </div>
              <i className="fas fa-lock text-slate-500"></i>
            </div>
          ) : player.age < 18 || player.highSchoolRetained ? (
            <Link href="/game/work/education" className="block bg-[#131b2f]/80 p-4 rounded-xl border border-[#2b3a5b] hover:border-emerald-500/50 transition-all group shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-900/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <i className="fas fa-school"></i>
                  </div>
                  <h3 className="font-bold text-white">Education</h3>
                </div>
                <div className={`px-2 py-1 rounded bg-[#0a0f1c] text-xs font-bold border ${player.schoolPerformance > 75 ? 'text-emerald-400 border-emerald-900/50' : 'text-amber-400 border-amber-900/50'}`}>
                  {player.schoolPerformance}%
                </div>
              </div>
              <div className="bg-[#0a0f1c] p-3 rounded-lg border border-[#1e2944] flex justify-between items-center">
                <div>
                  <div className="text-sm text-white font-bold">{getSchoolName()}</div>
                  <div className="text-xs text-emerald-400 font-medium uppercase tracking-widest mt-0.5">Enrolled</div>
                </div>
                <i className="fas fa-chevron-right text-slate-600 group-hover:text-emerald-400 transition-colors"></i>
              </div>
            </Link>
          ) : player.universityEnrolled ? (
            <Link href="/game/work/education" className="block bg-[#131b2f]/80 p-4 rounded-xl border border-[#2b3a5b] hover:border-cyan-500/50 transition-all group shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-900/20 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                  <h3 className="font-bold text-white">University</h3>
                </div>
                <div className={`px-2 py-1 rounded bg-[#0a0f1c] text-xs font-bold border ${player.schoolPerformance > 75 ? 'text-emerald-400 border-emerald-900/50' : 'text-amber-400 border-amber-900/50'}`}>
                  {player.schoolPerformance}%
                </div>
              </div>
              <div className="bg-[#0a0f1c] p-3 rounded-lg border border-[#1e2944] flex justify-between items-center">
                <div>
                  <div className="text-sm text-white font-bold">{player.major}</div>
                  <div className="text-xs text-cyan-400 font-medium uppercase tracking-widest mt-0.5">Enrolled</div>
                </div>
                <i className="fas fa-chevron-right text-slate-600 group-hover:text-cyan-400 transition-colors"></i>
              </div>
            </Link>
          ) : (
            <Link href="/game/work/education" className="block bg-[#131b2f]/80 p-4 rounded-xl border border-[#2b3a5b] hover:border-cyan-500/50 transition-all group shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#1b253c] flex items-center justify-center text-slate-400 border border-[#374b75]">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <h3 className="font-bold text-white">Education</h3>
              </div>
              <div className="bg-[#0a0f1c] p-3 rounded-lg border border-[#1e2944] flex justify-between items-center">
                <div className="text-sm text-white font-bold">Enroll in University</div>
                <i className="fas fa-chevron-right text-slate-600 group-hover:text-cyan-400 transition-colors"></i>
              </div>
            </Link>
          )}
        </div>

        {/* PART TIME JOBS */}
        {player.age < 15 ? (
          <div className="bg-[#131b2f]/40 p-4 rounded-xl border border-dashed border-[#2b3a5b] opacity-70 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1b253c] flex items-center justify-center text-slate-500 border border-[#374b75]">
                <i className="fas fa-clock"></i>
              </div>
              <div>
                <h3 className="font-bold text-slate-300">Part-Time Jobs</h3>
                <div className="text-xs text-slate-500">Available at Age 15</div>
              </div>
            </div>
            <i className="fas fa-lock text-slate-500"></i>
          </div>
        ) : hasPartTime ? (
          <Link href="/game/work/manage" className="block bg-[#131b2f]/80 p-4 rounded-xl border border-[#2b3a5b] hover:border-amber-500/50 transition-all group shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-900/20 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <i className="fas fa-clock"></i>
              </div>
              <h3 className="font-bold text-white">Part-Time Job</h3>
            </div>
            <div className="bg-[#0a0f1c] p-3 rounded-lg border border-[#1e2944] flex justify-between items-center">
              <div>
                <div className="text-sm text-white font-bold">{player.jobTitle}</div>
                <div className="text-xs text-emerald-400 font-medium mt-0.5">{formatMoney(player.jobSalary || 0)}/yr</div>
              </div>
              <i className="fas fa-chevron-right text-slate-600 group-hover:text-amber-400 transition-colors"></i>
            </div>
          </Link>
        ) : (
          <Link href="/game/work/part-time" className="block bg-[#131b2f]/80 p-4 rounded-xl border border-[#2b3a5b] hover:border-amber-500/50 transition-all group shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#1b253c] flex items-center justify-center text-slate-400 border border-[#374b75]">
                <i className="fas fa-clock"></i>
              </div>
              <h3 className="font-bold text-white">Part-Time Jobs</h3>
            </div>
            <div className="bg-[#0a0f1c] p-3 rounded-lg border border-[#1e2944] flex justify-between items-center">
              <div className="text-sm text-white font-bold">Find a part-time job</div>
              <i className="fas fa-chevron-right text-slate-600 group-hover:text-amber-400 transition-colors"></i>
            </div>
          </Link>
        )}

        {/* CAREERS */}
        {player.age < 18 ? (
          <div className="bg-[#131b2f]/40 p-4 rounded-xl border border-dashed border-[#2b3a5b] opacity-70 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#1b253c] flex items-center justify-center text-slate-500 border border-[#374b75]">
                <i className="fas fa-briefcase"></i>
              </div>
              <div>
                <h3 className="font-bold text-slate-300">Careers</h3>
                <div className="text-xs text-slate-500">Available at Age 18</div>
              </div>
            </div>
            <i className="fas fa-lock text-slate-500"></i>
          </div>
        ) : hasCareer ? (
          <Link href="/game/work/manage" className="block bg-[#131b2f]/80 p-4 rounded-xl border border-[#2b3a5b] hover:border-cyan-500/50 transition-all group shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-cyan-900/20 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                <i className="fas fa-briefcase"></i>
              </div>
              <h3 className="font-bold text-white">Career</h3>
            </div>
            <div className="bg-[#0a0f1c] p-3 rounded-lg border border-[#1e2944] flex justify-between items-center">
              <div>
                <div className="text-sm text-white font-bold">{player.jobTitle}</div>
                <div className="text-xs text-emerald-400 font-medium mt-0.5">{formatMoney(player.jobSalary || 0)}/yr</div>
              </div>
              <i className="fas fa-chevron-right text-slate-600 group-hover:text-cyan-400 transition-colors"></i>
            </div>
          </Link>
        ) : (
          <Link href="/game/work/careers" className="block bg-[#131b2f]/80 p-4 rounded-xl border border-[#2b3a5b] hover:border-cyan-500/50 transition-all group shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#1b253c] flex items-center justify-center text-slate-400 border border-[#374b75]">
                <i className="fas fa-briefcase"></i>
              </div>
              <h3 className="font-bold text-white">Careers</h3>
            </div>
            <div className="bg-[#0a0f1c] p-3 rounded-lg border border-[#1e2944] flex justify-between items-center">
              <div>
                <div className="text-sm text-white font-bold">Find a career</div>
                {player.hasBusiness && <div className="text-xs text-slate-500 italic mt-0.5">Note: CEO disables career track.</div>}
              </div>
              <i className="fas fa-chevron-right text-slate-600 group-hover:text-cyan-400 transition-colors"></i>
            </div>
          </Link>
        )}

        {/* ENTREPRENEURSHIP */}
        {!player.hasBusiness && (
          player.age < 18 ? (
            <div className="bg-[#131b2f]/40 p-4 rounded-xl border border-dashed border-[#2b3a5b] opacity-70 flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1b253c] flex items-center justify-center text-slate-500 border border-[#374b75]">
                  <i className="fas fa-rocket"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-300">Entrepreneurship</h3>
                  <div className="text-xs text-slate-500">Available at Age 18</div>
                </div>
              </div>
              <i className="fas fa-lock text-slate-500"></i>
            </div>
          ) : (
            <div className="bg-[#131b2f]/80 p-5 rounded-xl border border-[#2b3a5b] mb-8 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg tracking-tight">Entrepreneurship</h3>
                  <p className="text-sm text-slate-400">Start your own company.</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
                  <i className="fas fa-rocket text-xl drop-shadow-md"></i>
                </div>
              </div>
              <button onClick={() => router.push('/game/business/create')} className="w-full py-3 bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-600 hover:to-blue-800 rounded-lg font-bold text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-blue-500/50">
                Incorporate Business
              </button>
            </div>
          )
        )}
      </div>
    </main>
  );
}
