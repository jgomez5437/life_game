'use client';

import { usePlayerStore } from '@/features/player/usePlayerStore';
import { ageUpAction } from '@/features/player/actions/ageUp';
import { formatMoney } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/features/ui/useUIStore';
import { useState, useEffect, useRef } from 'react';

export default function GamePage() {
  const router = useRouter();
  const player = usePlayerStore();
  const [mounted, setMounted] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Slight delay ensures the DOM is fully painted after navigating back
    setTimeout(() => {
      if (isFirstRender.current) {
        logEndRef.current?.scrollIntoView({ behavior: 'auto' });
        isFirstRender.current = false;
      } else {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 10);
  }, [player.age, player.lifeLog.length, mounted]);
  if (!mounted) return null;

  if (!player.username) {
    return (
      <main className="min-h-screen bg-[#050508] flex flex-col items-center justify-center text-center p-6 font-sans">
        <p className="text-slate-400 text-lg mb-6">No active game found.</p>
        <Link
          href="/"
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
        >
          ← Start a New Life
        </Link>
      </main>
    );
  }

  if (player.isDead) {
    return <DeathScreen />;
  }

  let avatarIcon = '';
  if (player.age < 5) {
    avatarIcon = 'fas fa-baby text-emerald-400';
  } else if (player.age < 13) {
    avatarIcon = 'fas fa-child text-yellow-400';
  } else {
    avatarIcon = player.gender === 'male' ? 'fas fa-male text-cyan-400' : 'fas fa-female text-fuchsia-400';
  }

  const displayLog = [...player.lifeLog];

  return (
    <main className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col w-full max-w-lg mx-auto relative overflow-hidden shadow-2xl border-x border-[#212b45]">
      {/* Top Bar Header */}
      <header className="flex items-center justify-between p-4 bg-[#111727]/80 backdrop-blur-xl border-b border-[#212b45] z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#1b253c] border-2 border-[#2b3a5b] flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <i className={`${avatarIcon} text-2xl`}></i>
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight drop-shadow-md">{player.username}</h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">{player.lifeStatus}</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <div className="bg-[#18233a] px-3 py-1 rounded-lg border border-[#2b3a5b] flex items-center gap-2">
            <i className="fas fa-heart text-rose-500 text-xs"></i>
            <span className="font-bold text-sm text-white">{player.health}%</span>
          </div>
          <div className="bg-[#18233a] px-3 py-1 rounded-lg border border-[#2b3a5b] flex items-center gap-2">
            <i className="fas fa-wallet text-emerald-400 text-xs"></i>
            <span className="font-bold text-sm text-emerald-400">{formatMoney(player.money)}</span>
          </div>
        </div>
      </header>

      {/* Life Log Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth pb-32 custom-scrollbar">
        {displayLog.length === 0 ? (
          <div className="text-center text-slate-500 italic mt-10">Life has just begun...</div>
        ) : (
          displayLog.map((logEntry) => (
            <div key={logEntry.age} className="group animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center mb-3">
                <div className="bg-[#1e2944] text-cyan-200 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-cyan-900 shadow-[0_0_10px_rgba(34,211,238,0.2)] z-10">
                  Age {logEntry.age}
                </div>
                <div className="h-px bg-gradient-to-r from-cyan-900/50 to-transparent flex-grow ml-2"></div>
              </div>
              <div className="pl-4 border-l-2 border-[#1e2944] ml-4 space-y-2 pb-2">
                {logEntry.events.map((e, i) => {
                  let textColor = 'text-slate-300';
                  if (e.color.includes('green')) textColor = 'text-emerald-400 font-medium';
                  if (e.color.includes('red')) textColor = 'text-rose-400 font-medium';
                  if (e.color.includes('yellow')) textColor = 'text-amber-400 font-bold';
                  if (e.color.includes('blue')) textColor = 'text-cyan-400 font-medium';

                  return (
                    <div key={i} className={`${textColor} text-[15px] leading-snug transition-transform duration-200 hover:translate-x-1`}>
                      {e.msg}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 w-full bg-[#111727]/90 backdrop-blur-xl border-t border-[#212b45] p-3 z-20 pb-safe">
        <div className="grid grid-cols-5 gap-2 w-full max-w-lg mx-auto">
          <NavButton icon="fa-home" label="Assets" color="text-amber-400" onClick={() => router.push('/game/assets')} />
          <NavButton icon="fa-user-graduate" label="Work" color="text-cyan-400" onClick={() => router.push('/game/work')} />
          
          <button 
            onClick={() => ageUpAction()}
            className="col-span-1 bg-gradient-to-b from-fuchsia-500 to-fuchsia-700 hover:from-fuchsia-400 hover:to-fuchsia-600 text-white rounded-2xl shadow-[0_0_20px_rgba(217,70,239,0.4)] flex flex-col items-center justify-center py-2 transform transition active:scale-95 border border-fuchsia-400/30"
          >
            <i className="fas fa-arrow-up text-xl mb-1 drop-shadow-md"></i>
            <span className="text-[10px] uppercase font-extrabold tracking-widest drop-shadow-md">Age +</span>
          </button>

          <NavButton icon="fa-users" label="Social" color="text-pink-400" onClick={() => router.push('/game/social')} />
          <NavButton icon="fa-ellipsis-h" label="More" color="text-slate-400" onClick={() => useUIStore.getState().showAlert("Coming Soon")} />
        </div>
      </div>
    </main>
  );
}

function NavButton({ icon, label, color, onClick }: { icon: string, label: string, color: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center py-2 rounded-xl hover:bg-[#1e2944] transition-colors border border-transparent hover:border-[#2b3a5b]"
    >
      <i className={`fas ${icon} text-xl mb-1 ${color}`}></i>
      <span className="text-[10px] text-slate-300 uppercase tracking-widest font-semibold">{label}</span>
    </button>
  );
}

function DeathScreen() {
  const player = usePlayerStore();
  const resetPlayer = usePlayerStore(s => s.resetPlayer);
  const router = useRouter();

  const handleStartNewLife = () => {
    resetPlayer();
    router.push('/');
  };

  const totalEstate = player.money + (player.assets?.reduce((sum, a) => sum + (a.value || 0), 0) || 0);
  const moneyColor = totalEstate >= 0 ? 'text-emerald-400' : 'text-rose-500';
  
  const children = player.relationships.filter(r => r.type === 'child' || r.name.includes('Son') || r.name.includes('Daughter'));
  const hasChildren = children.length > 0;
  const inheritancePerChild = (hasChildren && totalEstate > 0) ? Math.floor(totalEstate / children.length) : 0;

  const handleContinueAsChild = (child: any) => {
    // "Continue as Child" reconstruction pipeline
    const inheritedMoney = inheritancePerChild;
    const isSon = child.gender === 'male' || child.type === 'Son'; // fallback if old schema
    
    usePlayerStore.setState({
      username: child.name,
      gender: isSon ? 'male' : 'female',
      age: child.age,
      money: inheritedMoney,
      health: 100,
      isDead: false,
      lifeStatus: 'Student', // Recalculated by GameLogic ideally, but stub for now
      isStudent: child.age >= 5 && child.age <= 18,
      jobTitle: '',
      jobSalary: 0,
      assets: [],
      relationships: [], // wipe relationships
      lifeLog: [{
        age: child.age,
        events: [
          { msg: `You took over the life of ${child.name} following your parent's death.`, color: 'text-cyan-400 font-bold' },
          { msg: `Inherited $${inheritedMoney.toLocaleString()} from the estate.`, color: 'text-emerald-400' }
        ]
      }]
    });
  };

  return (
    <div className="min-h-screen bg-[#050202] flex flex-col justify-center items-center text-center p-6 font-sans">
      <div className="animate-in zoom-in duration-700 w-full max-w-lg w-full">
        <i className="fas fa-skull text-7xl text-rose-900 mb-6 drop-shadow-[0_0_30px_rgba(225,29,72,0.5)]"></i>
        <h1 className="text-5xl font-black text-rose-600 mb-3 tracking-tight">YOU DIED</h1>
        <p className="text-slate-300 text-lg mb-8">Age {player.age} • {player.deathCause}</p>
        
        <div className="bg-[#110505] p-6 rounded-2xl border border-rose-900/30 mb-8 shadow-2xl">
          <h3 className="text-xs font-bold text-rose-400/70 mb-2 uppercase tracking-widest">Final Estate Value</h3>
          <p className={`${moneyColor} text-4xl font-black mb-4 tracking-tighter`}>{formatMoney(totalEstate)}</p>
          {totalEstate < 0 ? (
            <p className="text-slate-500 text-sm italic">You died in debt. Your creditors absorbed the loss.</p>
          ) : hasChildren ? (
            <p className="text-slate-300 text-sm leading-relaxed">
              Wealth split evenly among {children.length} children.<br/>
              <span className="text-emerald-400 font-bold block mt-1">+${inheritancePerChild.toLocaleString()} each</span>
            </p>
          ) : (
            <p className="text-slate-500 text-sm italic">Having no heirs, your estate was surrendered to the government.</p>
          )}
        </div>

        <div className="space-y-3 w-full">
          {hasChildren && children.map((child, idx) => (
            <button 
              key={idx}
              onClick={() => handleContinueAsChild(child)}
              className="w-full bg-[#151a28] border border-[#2b3a5b] hover:bg-[#1e2638] text-cyan-100 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-user text-cyan-500"></i>
              Play as {child.name} (Age {child.age})
            </button>
          ))}
          
          <button 
            onClick={handleStartNewLife}
            className="w-full bg-gradient-to-r from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white font-black uppercase tracking-widest py-4 rounded-xl text-lg mt-6 shadow-[0_0_20px_rgba(225,29,72,0.3)] transition-all"
          >
            Start New Life
          </button>
        </div>
      </div>
    </div>
  );
}
