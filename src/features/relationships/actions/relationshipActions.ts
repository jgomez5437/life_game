import { usePlayerStore } from '@/features/player/usePlayerStore';
import { Relationship } from '@/types/player';

// We don't have uuid installed natively perhaps, so let's just use a simple generator
const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : 'rel_' + Date.now() + Math.floor(Math.random() * 1000);
};

/**
 * Add a new relationship to the player's network.
 */
export const addRelationshipAction = (
  name: string,
  age: number,
  type: string,
  bond: number,
  category: Relationship['category'] = 'friend'
) => {
  const store = usePlayerStore.getState();
  
  let finalCategory = category;
  let finalType = type;
  
  if (!['family', 'spouse', 'child'].includes(finalCategory)) {
    if (bond < 30) {
      finalCategory = 'enemy';
      finalType = 'Enemy';
    } else {
      finalCategory = 'friend';
      if (finalType === 'Enemy') finalType = 'Friend';
    }
  }

  const newRel: Relationship = {
    id: generateId(),
    name,
    age,
    type: finalType,
    bond,
    category: finalCategory
  };

  usePlayerStore.setState(state => ({
    relationships: [...state.relationships, newRel]
  }));

  return newRel;
};

export type InteractionActionKey = 'spend_time' | 'give_money' | 'insult' | 'compliment' | 'call_chat';

export const INTERACTION_CONFIG = {
  spend_time: { name: 'Spend Time', bondChange: 15, cost: 0, icon: 'fa-clock', desc: 'Spend quality time together' },
  give_money: { name: 'Give Money', bondChange: 10, cost: 500, icon: 'fa-money-bill', desc: 'Give a monetary gift' },
  insult: { name: 'Insult', bondChange: -20, cost: 0, icon: 'fa-angry', desc: 'Say something mean' },
  compliment: { name: 'Compliment', bondChange: 15, cost: 0, icon: 'fa-heart', desc: 'Say something nice' },
  call_chat: { name: 'Call to Chat', bondChange: 10, cost: 0, icon: 'fa-phone', desc: 'Have a quick chat over the phone' }
};

/**
 * Interact with a relationship.
 */
export const interactWithPersonAction = (
  personId: string, 
  actionKey: InteractionActionKey
): { success: boolean; message: string } => {
  const store = usePlayerStore.getState();
  const person = store.relationships.find(r => r.id === personId);
  
  if (!person) return { success: false, message: 'Person not found.' };

  const action = INTERACTION_CONFIG[actionKey];

  // Safety Age Gates
  let isTooYoung = false;
  if (actionKey === 'spend_time' && store.age <= 1) isTooYoung = true;
  else if ((actionKey === 'insult' || actionKey === 'compliment') && store.age <= 2) isTooYoung = true;
  else if (actionKey === 'call_chat' && store.age <= 5) isTooYoung = true;
  else if (actionKey === 'give_money' && store.age <= 10) isTooYoung = true;

  if (isTooYoung) {
    return { success: false, message: 'You are too young to do this.' };
  }

  // Financial Gates
  if (store.money < action.cost) {
    return { success: false, message: `You need $${action.cost.toLocaleString()} to ${action.name.toLowerCase()}.` };
  }

  // Execute Action
  const prev = person.bond;
  const newBond = Math.max(0, Math.min(100, prev + action.bondChange));
  const delta = newBond - prev;

  let newCategory = person.category;
  let newType = person.type;
  let eventMsg = null;

  // Category Shifts
  if (!['family', 'spouse', 'child'].includes(newCategory)) {
    if (newBond < 30 && newCategory !== 'enemy') {
      newCategory = 'enemy';
      newType = 'Enemy';
      eventMsg = { msg: `${person.name} is now your Enemy!`, color: 'bad' };
    } else if (newBond >= 30 && newCategory === 'enemy') {
      newCategory = 'friend';
      newType = 'Friend';
      eventMsg = { msg: `You made amends with ${person.name}. They are now a Friend.`, color: 'good' };
    }
  }

  // Persist State
  usePlayerStore.setState(state => {
    const updatedRels = state.relationships.map(r => 
      r.id === personId 
        ? { ...r, bond: newBond, category: newCategory, type: newType } 
        : r
    );

    return {
      money: state.money - action.cost,
      relationships: updatedRels
    };
  });

  // Logging
  const storeAfter = usePlayerStore.getState();
  if (eventMsg) {
    storeAfter.addLog(eventMsg.msg, eventMsg.color as 'good'|'bad'|'neutral');
  }
  
  const sign = delta > 0 ? `+${delta}` : delta;
  const color = delta > 0 ? 'good' : delta < 0 ? 'bad' : 'neutral';
  storeAfter.addLog(`${action.name}: ${person.name} (${sign} relationship)`, color);

  return { success: true, message: `${person.name}'s relationship status is now ${newBond}%.` };
};
