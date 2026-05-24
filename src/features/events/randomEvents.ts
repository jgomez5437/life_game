import { PlayerState } from '@/types/player';

const RANDOM_EVENTS = [
  {
    name: 'Found Money',
    probability: 0.1,
    execute: (draft: Partial<PlayerState>, addLog: (msg: string, type: string) => void) => {
      const amount = Math.floor(Math.random() * 100) + 10;
      draft.money = (draft.money || 0) + amount;
      addLog(`You found $${amount} on the ground!`, 'good');
    }
  },
  {
    name: 'Caught a Cold',
    probability: 0.15,
    execute: (draft: Partial<PlayerState>, addLog: (msg: string, type: string) => void) => {
      const dmg = Math.floor(Math.random() * 10) + 5;
      draft.health = Math.max(1, (draft.health || 100) - dmg);
      addLog('You caught a cold and feel a bit under the weather.', 'bad');
    }
  },
  {
    name: 'Had a Great Day',
    probability: 0.1,
    execute: (draft: Partial<PlayerState>, addLog: (msg: string, type: string) => void) => {
      draft.health = Math.min(100, (draft.health || 100) + 5);
      addLog('You had a wonderfully peaceful day. (+Health)', 'good');
    }
  },
  {
    name: 'Stubbed Toe',
    probability: 0.1,
    execute: (draft: Partial<PlayerState>, addLog: (msg: string, type: string) => void) => {
      draft.health = Math.max(1, (draft.health || 100) - 2);
      addLog('You stubbed your toe really hard. Ouch!', 'bad');
    }
  }
];

/**
 * Triggers a random life event based on probability.
 */
export const triggerRandomEvent = (draft: Partial<PlayerState>, addLog: (msg: string, type: 'good' | 'bad' | 'neutral' | 'major') => void) => {
  // 30% chance for an event to happen each year
  if (Math.random() > 0.3) return;

  // Pick a random event based on weights (simple uniform distribution for now)
  const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
  
  event.execute(draft, addLog as (msg: string, type: string) => void);
};
