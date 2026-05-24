'use client';

import { usePlayerStore } from '@/features/player/usePlayerStore';
import { Relationship } from '@/types/player';
import { interactWithPersonAction, INTERACTION_CONFIG, InteractionActionKey } from '@/features/relationships/actions/relationshipActions';
import { formatMoney } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useUIStore } from '@/features/ui/useUIStore';
import { useState } from 'react';

export default function SocialPage() {
  const router = useRouter();
  const player = usePlayerStore();
  const relationships = player.relationships || [];

  const [selectedPerson, setSelectedPerson] = useState<Relationship | null>(null);

  const family = relationships.filter(r => ['family', 'spouse', 'child'].includes(r.category));
  const friends = relationships.filter(r => r.category === 'friend');
  const enemies = relationships.filter(r => r.category === 'enemy');

  const handleInteraction = (key: InteractionActionKey) => {
    if (!selectedPerson) return;
    
    // Check Confirm
    const action = INTERACTION_CONFIG[key];
    const costStr = action.cost > 0 ? ` This will cost ${formatMoney(action.cost)}.` : '';
    useUIStore.getState().showConfirm(`Are you sure you want to ${action.name.toLowerCase()} with ${selectedPerson.name}?${costStr}`, () => {
      const res = interactWithPersonAction(selectedPerson.id, key);
      
      if (!res.success) {
        useUIStore.getState().showAlert(res.message);
      } else {
        // Find updated person in state to update modal view
        const updatedStore = usePlayerStore.getState();
        const updatedPerson = updatedStore.relationships.find(r => r.id === selectedPerson.id);
        if (updatedPerson) setSelectedPerson(updatedPerson);
      }
    });
  };

  const renderCard = (person: Relationship) => {
    let barColor = 'bg-emerald-500';
    if (person.bond < 30) barColor = 'bg-rose-500';
    else if (person.bond < 60) barColor = 'bg-amber-500';

    let icon = 'fa-user';
    let badgeColor = 'bg-slate-600 border-slate-500';

    if (['family', 'spouse', 'child'].includes(person.category)) {
      if (person.category === 'spouse') icon = 'fa-heart text-fuchsia-400';
      if (person.category === 'child') icon = 'fa-baby text-blue-300';
      badgeColor = 'bg-blue-600 border-blue-400 shadow-blue-900/50';
    } else if (person.category === 'friend') {
      badgeColor = 'bg-emerald-600 border-emerald-400 shadow-emerald-900/50';
    } else if (person.category === 'enemy') {
      icon = 'fa-angry text-rose-400';
      badgeColor = 'bg-rose-600 border-rose-400 shadow-rose-900/50';
    }

    return (
      <div 
        key={person.id}
        onClick={() => setSelectedPerson(person)}
        className="bg-[#131b2f] p-3 rounded-xl border border-[#2b3a5b] mb-3 cursor-pointer hover:bg-[#1b253c] hover:border-blue-500/50 transition flex items-center justify-between group shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#0a0f1c] flex items-center justify-center text-slate-400 group-hover:bg-[#111727] transition border border-[#2b3a5b] shadow-inner">
            <i className={`fas ${icon}`}></i>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-bold text-white text-sm tracking-wide">{person.name}</h4>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider text-white shadow-sm ${badgeColor}`}>
                {person.type}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-medium">Age: {person.age || '?'}</div>
          </div>
        </div>

        <div className="text-right w-24">
          <div className="text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-widest">Status</div>
          <div className="w-full bg-[#0a0f1c] h-1.5 rounded-full overflow-hidden border border-[#2b3a5b]/50">
            <div className={`h-full ${barColor} shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-all duration-500`} style={{ width: `${person.bond}%` }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="h-[100dvh] bg-[#080b12] text-slate-200 font-sans flex flex-col w-full max-w-lg mx-auto shadow-2xl border-x border-[#212b45] relative overflow-hidden">
      <header className="flex items-center p-4 bg-[#111727]/80 backdrop-blur-xl border-b border-[#212b45] z-10 shadow-lg">
        <button onClick={() => router.push('/game')} className="text-blue-400 hover:text-blue-300 transition-colors mr-4">
          <i className="fas fa-arrow-left text-xl"></i>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Relationships</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-32">
        {family.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-blue-400 font-bold text-xs uppercase mb-3 pl-1 flex items-center gap-2 tracking-widest">
              <i className="fas fa-home"></i> Family
            </h3>
            {family.map(renderCard)}
          </div>
        ) : (
          <div className="text-slate-600 italic text-sm text-center py-4 border border-dashed border-[#2b3a5b] rounded-xl mb-6">
            You have no family contacts.
          </div>
        )}

        {friends.length > 0 && (
          <div className="mb-6">
            <h3 className="text-emerald-400 font-bold text-xs uppercase mb-3 pl-1 flex items-center gap-2 tracking-widest">
              <i className="fas fa-user-friends"></i> Friends
            </h3>
            {friends.map(renderCard)}
          </div>
        )}

        {enemies.length > 0 && (
          <div className="mb-6">
            <h3 className="text-rose-400 font-bold text-xs uppercase mb-3 pl-1 flex items-center gap-2 tracking-widest">
              <i className="fas fa-skull-crossbones"></i> Enemies
            </h3>
            {enemies.map(renderCard)}
          </div>
        )}
      </div>

      {/* INTERACTION MODAL */}
      {selectedPerson && (
        <div className="absolute inset-0 z-50 bg-[#080b12]/95 backdrop-blur-xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <header className="flex items-center p-4 bg-transparent border-b border-[#212b45]">
            <button onClick={() => setSelectedPerson(null)} className="text-blue-400 hover:text-blue-300 transition-colors mr-4">
              <i className="fas fa-arrow-left text-xl"></i>
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">Interact</h1>
          </header>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col">
            <div className="text-center mb-6 mt-4">
              <div className="w-20 h-20 rounded-full bg-[#1b253c] flex items-center justify-center text-slate-300 mx-auto mb-3 text-3xl border border-[#2b3a5b] shadow-lg">
                <i className="fas fa-user"></i>
              </div>
              <h2 className="text-2xl font-bold text-white">{selectedPerson.name}</h2>
              <div className="text-slate-400 text-sm mt-1 mb-3">Age: {selectedPerson.age || '?'}</div>
              
              <div className="bg-[#111727] p-4 rounded-xl border border-[#212b45] shadow-md max-w-[250px] mx-auto">
                <div className="text-xs text-slate-400 font-bold mb-2 uppercase tracking-widest">Relationship Status</div>
                <div className="w-full bg-[#0a0f1c] h-2 rounded-full overflow-hidden border border-[#2b3a5b]/50 mb-2">
                  <div className={`h-full ${selectedPerson.bond < 30 ? 'bg-rose-500' : selectedPerson.bond < 60 ? 'bg-amber-500' : 'bg-emerald-500'} transition-all duration-500 shadow-[0_0_8px_rgba(0,0,0,0.5)]`} style={{ width: `${selectedPerson.bond}%` }}></div>
                </div>
                <div className="text-sm font-bold text-white">{selectedPerson.bond}%</div>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-widest px-1">Choose an Action</div>
            <div className="space-y-3 pb-8">
              {(Object.keys(INTERACTION_CONFIG) as InteractionActionKey[]).map(key => {
                const action = INTERACTION_CONFIG[key];
                
                // Client-side visual block checks
                let isTooYoung = false;
                if (key === 'spend_time' && player.age <= 1) isTooYoung = true;
                else if ((key === 'insult' || key === 'compliment') && player.age <= 2) isTooYoung = true;
                else if (key === 'call_chat' && player.age <= 5) isTooYoung = true;
                else if (key === 'give_money' && player.age <= 10) isTooYoung = true;

                const canAfford = player.money >= action.cost;
                const isDisabled = isTooYoung || !canAfford;

                return (
                  <button 
                    key={key}
                    onClick={() => handleInteraction(key)}
                    disabled={isDisabled}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all shadow-md group ${isDisabled ? 'bg-[#131b2f]/50 border-[#2b3a5b]/50 opacity-50 cursor-not-allowed' : 'bg-[#131b2f] border-[#2b3a5b] hover:bg-[#1b253c] hover:border-blue-500/50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#0a0f1c] flex items-center justify-center text-slate-400 shadow-inner">
                        <i className={`fas ${action.icon} text-lg group-hover:text-blue-400 transition-colors`}></i>
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-white text-base group-hover:text-blue-300 transition-colors">{action.name}</h3>
                        <div className="text-xs text-slate-400 font-medium">
                          {action.desc} 
                          {action.cost > 0 ? ` — ${formatMoney(action.cost)}` : ''}
                        </div>
                      </div>
                    </div>
                    
                    {!isDisabled ? (
                      <div className={`text-sm font-bold ${action.bondChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {action.bondChange > 0 ? '+' : ''}{action.bondChange}
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-rose-400 uppercase tracking-widest text-right">
                        {isTooYoung ? 'Too Young' : 'No Funds'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
