'use client';

import { usePlayerStore } from '@/features/player/usePlayerStore';
import { MAJORS, GRAD_SCHOOLS } from '@/lib/constants';
import { enrollUniversityAction, enrollGradSchoolAction, studyHarderAction, skipSchoolAction } from '@/features/education/actions/educationActions';
import { formatMoney } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/features/ui/useUIStore';
import { useState } from 'react';

export default function EducationManagerPage() {
  const router = useRouter();
  const player = usePlayerStore();
  
  // State for the payment modal
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [isGradSchool, setIsGradSchool] = useState<boolean>(false);

  const isPrimaryOrSecondary = player.age >= 5 && (player.age < 18 || player.highSchoolRetained) && !player.universityEnrolled && !player.gradSchoolEnrolled;

  // If already enrolled in something
  if (player.gradSchoolEnrolled || player.universityEnrolled || isPrimaryOrSecondary) {
    const isGrad = player.gradSchoolEnrolled;
    
    let title = "";
    let year: number | string = "";

    if (isGrad) {
      title = player.gradSchoolType as string;
      year = player.gradSchoolYear + 1;
    } else if (player.universityEnrolled) {
      title = player.major;
      year = player.universitySchoolYear + 1;
    } else {
      if (player.age < 12) { title = `${player.city} Elementary School`; year = `Age ${player.age}`; }
      else if (player.age < 14) { title = `${player.city} Middle School`; year = `Age ${player.age}`; }
      else { title = `${player.city} High School`; year = `Age ${player.age}`; }
    }

    return (
      <main className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col w-full max-w-lg mx-auto shadow-2xl border-x border-[#212b45] relative overflow-hidden">
        <header className="flex items-center p-4 bg-[#111727]/80 backdrop-blur-xl border-b border-[#212b45] z-10 shadow-lg">
          <button onClick={() => router.push('/game/work')} className="text-cyan-400 hover:text-cyan-300 transition-colors mr-4">
            <i className="fas fa-arrow-left text-xl"></i>
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">My Education</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col pb-32">
          <div className="text-center mb-8 mt-4">
            <div className="w-24 h-24 rounded-full bg-[#1b253c] flex items-center justify-center border-4 border-[#2b3a5b] shadow-[0_0_30px_rgba(34,211,238,0.15)] mx-auto mb-4 text-cyan-400">
              <i className={`fas ${isGrad ? 'fa-university' : 'fa-graduation-cap'} text-4xl drop-shadow-md`}></i>
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <div className="text-emerald-400 font-black text-xl mt-1 tracking-tight">Year {year}</div>
          </div>

          <div className="bg-[#111727] p-6 rounded-2xl border border-[#212b45] mb-6 shadow-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Performance</span>
              <span className={`${player.schoolPerformance < 50 ? 'text-rose-400' : 'text-emerald-400'} font-bold`}>{player.schoolPerformance}%</span>
            </div>
            <div className="w-full bg-[#0a0f1c] h-3 rounded-full overflow-hidden border border-[#2b3a5b]/50 shadow-inner">
              <div className={`h-full ${player.schoolPerformance < 50 ? 'bg-rose-500' : 'bg-emerald-500'} transition-all duration-500`} style={{ width: `${player.schoolPerformance}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center font-medium">
              {player.schoolPerformance < 40 ? "You are failing your classes. Study more!" : "You are getting good grades."}
            </p>
          </div>

          <div className="mt-auto space-y-3">
            <button 
              onClick={() => {
                const res = studyHarderAction();
                if (!res.success) useUIStore.getState().showAlert(res.message);
              }}
              className="w-full p-4 rounded-xl border bg-[#131b2f] border-[#2b3a5b] hover:bg-[#1b253c] hover:border-cyan-500/50 transition-all shadow-md flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-cyan-400 shadow-inner">
                  <i className="fas fa-book-reader text-lg"></i>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">Study Harder</h3>
                  <div className="text-xs text-slate-400 font-medium">Increase grades this year</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-slate-600 group-hover:text-cyan-400 transition-colors"></i>
            </button>

            <button 
              onClick={() => {
                const res = skipSchoolAction();
                if (!res.success) useUIStore.getState().showAlert(res.message);
              }}
              className="w-full p-4 rounded-xl border bg-[#131b2f] border-[#2b3a5b] hover:bg-[#1b253c] hover:border-amber-500/50 transition-all shadow-md flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-amber-400 shadow-inner">
                  <i className="fas fa-user-ninja text-lg"></i>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-white text-base group-hover:text-amber-300 transition-colors">Skip School</h3>
                  <div className="text-xs text-slate-400 font-medium">Play hooky (grades will drop)</div>
                </div>
              </div>
              <i className="fas fa-chevron-right text-slate-600 group-hover:text-amber-400 transition-colors"></i>
            </button>

            {!isPrimaryOrSecondary && (
              <button 
                onClick={() => {
                  useUIStore.getState().showConfirm('Are you sure you want to drop out?', () => {
                    usePlayerStore.getState().setEducation({ universityEnrolled: false, gradSchoolEnrolled: false, isStudent: false });
                    usePlayerStore.getState().addLog('You dropped out of school.', 'bad');
                    router.push('/game/work');
                  });
                }}
                className="w-full p-4 rounded-xl border bg-rose-900/20 border-rose-800/50 hover:bg-rose-900/40 hover:border-rose-500/50 transition-all shadow-md flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-rose-400 shadow-inner">
                    <i className="fas fa-door-open text-lg"></i>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-white text-base group-hover:text-rose-300 transition-colors">Drop Out</h3>
                    <div className="text-xs text-rose-300/70 font-medium">Quit school immediately</div>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ENROLLMENT VIEW
  const showGradSchools = player.universityGraduated;
  
  const openPaymentModal = (program: string, isGrad: boolean) => {
    setSelectedProgram(program);
    setIsGradSchool(isGrad);
  };

  const handlePaymentChoice = (method: 'cash' | 'loan' | 'scholarship' | 'parents') => {
    if (!selectedProgram) return;

    let res;
    if (isGradSchool) {
      res = enrollGradSchoolAction(selectedProgram, method);
    } else {
      res = enrollUniversityAction(selectedProgram, method);
    }

    if (res.success) {
      router.push('/game/work');
    } else {
      useUIStore.getState().showAlert(res.message);
      if (!res.requiresChoiceAgain) {
        setSelectedProgram(null);
      }
    }
  };

  return (
    <main className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col w-full max-w-lg mx-auto shadow-2xl border-x border-[#212b45] relative overflow-hidden">
      <header className="flex items-center p-4 bg-[#111727]/80 backdrop-blur-xl border-b border-[#212b45] z-10 shadow-lg">
        <button onClick={() => router.push('/game/work')} className="text-cyan-400 hover:text-cyan-300 transition-colors mr-4">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">
          {showGradSchools ? 'Graduate School' : 'University'}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
        <div className="text-center mb-6 mt-2">
          <div className="w-16 h-16 rounded-full bg-cyan-900/30 flex items-center justify-center text-cyan-400 mx-auto mb-3 text-2xl shadow-inner border border-cyan-500/20">
            <i className={`fas ${showGradSchools ? 'fa-university' : 'fa-graduation-cap'} drop-shadow-md`}></i>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Enroll in a Program</h2>
          <p className="text-slate-400 text-sm mt-1">Select your path.</p>
        </div>

        {showGradSchools ? (
          GRAD_SCHOOLS.map((school, idx) => (
            <div key={idx} className="bg-[#131b2f]/80 backdrop-blur-md p-4 rounded-xl border border-[#2b3a5b] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1b253c] flex items-center justify-center border border-[#374b75] shadow-inner shrink-0 text-cyan-400">
                  <i className={`fas ${school.icon} text-xl drop-shadow-md`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-none mb-1.5">{school.name}</h3>
                  <div className="text-xs text-slate-400 capitalize font-medium">{school.years} Year Program</div>
                </div>
              </div>
              <button 
                onClick={() => openPaymentModal(school.name, true)}
                className="ml-3 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-md whitespace-nowrap bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Enroll
              </button>
            </div>
          ))
        ) : (
          MAJORS.map((major, idx) => (
            <div key={idx} className="bg-[#131b2f]/80 backdrop-blur-md p-4 rounded-xl border border-[#2b3a5b] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1b253c] flex items-center justify-center border border-[#374b75] shadow-inner shrink-0 text-emerald-400">
                  <i className={`fas ${major.icon} text-xl drop-shadow-md`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm leading-none mb-1.5">{major.name}</h3>
                  <div className="text-xs text-slate-400 capitalize font-medium">4 Year Program</div>
                </div>
              </div>
              <button 
                onClick={() => openPaymentModal(major.name, false)}
                className="ml-3 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-md whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Enroll
              </button>
            </div>
          ))
        )}
      </div>

      {/* PAYMENT MODAL */}
      {selectedProgram && (
        <div className="absolute inset-0 z-50 bg-[#080b12]/95 backdrop-blur-xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <header className="flex items-center p-4 bg-transparent border-b border-[#212b45]">
            <button onClick={() => setSelectedProgram(null)} className="text-cyan-400 hover:text-cyan-300 transition-colors mr-4">
              <i className="fas fa-arrow-left text-xl"></i>
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Payment Options</h1>
          </header>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            <div className="text-center mb-8 mt-4">
              <div className="w-20 h-20 rounded-full bg-emerald-900/30 flex items-center justify-center border-4 border-emerald-900/50 shadow-[0_0_30px_rgba(52,211,153,0.15)] mx-auto mb-4 text-emerald-400">
                <i className="fas fa-money-bill-wave text-3xl drop-shadow-md"></i>
              </div>
              <h2 className="text-2xl font-bold text-white">Tuition Funding</h2>
              <p className="text-slate-400 text-sm mt-2">How will you pay for {selectedProgram}?</p>
              <div className="text-emerald-400 font-bold text-lg mt-2">
                Cost: {formatMoney(isGradSchool ? 100000 : 40000)}
              </div>
            </div>

            <div className="space-y-3 pb-8">
              <button onClick={() => handlePaymentChoice('cash')} className="w-full p-4 rounded-xl border bg-[#131b2f] border-[#2b3a5b] hover:bg-[#1b253c] hover:border-emerald-500/50 transition-all shadow-md flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-emerald-400 shadow-inner">
                    <i className="fas fa-coins text-lg"></i>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-white text-base">Pay Cash</h3>
                    <div className="text-xs text-slate-400 font-medium">Use your savings</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-slate-600 group-hover:text-emerald-400 transition-colors"></i>
              </button>

              <button onClick={() => handlePaymentChoice('loan')} className="w-full p-4 rounded-xl border bg-[#131b2f] border-[#2b3a5b] hover:bg-[#1b253c] hover:border-amber-500/50 transition-all shadow-md flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-amber-400 shadow-inner">
                    <i className="fas fa-file-invoice-dollar text-lg"></i>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-white text-base">Student Loan</h3>
                    <div className="text-xs text-slate-400 font-medium">Borrow the money</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-slate-600 group-hover:text-amber-400 transition-colors"></i>
              </button>

              <button 
                onClick={() => handlePaymentChoice('scholarship')} 
                disabled={player.scholarshipTried}
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all shadow-md group ${player.scholarshipTried ? 'bg-[#1b253c]/50 border-[#2b3a5b] opacity-50 cursor-not-allowed' : 'bg-[#131b2f] border-[#2b3a5b] hover:bg-[#1b253c] hover:border-fuchsia-500/50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-fuchsia-400 shadow-inner">
                    <i className="fas fa-award text-lg"></i>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-white text-base">Apply for Scholarship</h3>
                    <div className="text-xs text-slate-400 font-medium">{player.scholarshipTried ? 'Denied' : 'Chance to win free tuition'}</div>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-slate-600 group-hover:text-fuchsia-400 transition-colors"></i>
              </button>

              <button 
                onClick={() => handlePaymentChoice('parents')} 
                disabled={player.parentsTried}
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all shadow-md group ${player.parentsTried ? 'bg-[#1b253c]/50 border-[#2b3a5b] opacity-50 cursor-not-allowed' : 'bg-[#131b2f] border-[#2b3a5b] hover:bg-[#1b253c] hover:border-cyan-500/50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-cyan-400 shadow-inner">
                    <i className="fas fa-users text-lg"></i>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-white text-base">Ask Parents</h3>
                    <div className="text-xs text-slate-400 font-medium">{player.parentsTried ? 'They already said no.' : 'Beg them to pay for it'}</div>
                  </div>
                </div>
                {!player.parentsTried && <i className="fas fa-chevron-right text-slate-600 group-hover:text-cyan-400 transition-colors"></i>}
              </button>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}
