import { GameLogic } from '../../core/gameLogic.js';
import { AvatarLogic } from '../../core/avatarLogic.js';

export const FamilyFactory = (() => {
    // 1. Pure Helper Functions (Isolated to this factory)
    // Name pools live in gameLogic.js's GameLogic.getRandomFirstName to avoid duplicating the lists here.
    const getInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getName = (gender) => GameLogic.getRandomFirstName(gender);
    const getUUID = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);

    // 3. Public API
    return {
        generateFamily: (lastName) => {
            const family = [];
            
            // --- A. PARENT GENERATION ---
            const parentRoll = Math.random();
            let hasMother = false;
            let hasFather = false;

            if (parentRoll < 0.75) {
                hasMother = true;
                hasFather = true; // 75% Both
            } else if (parentRoll < 0.90) {
                hasMother = true; // 15% Single Mom
            } else if (parentRoll < 0.95) {
                hasFather = true; // 5% Single Dad
            } 
            // Remaining 5% = Orphan (Variables stay false)

            if (hasMother) {
                const id = getUUID();
                const age = getInt(18, 45);
                const occ = GameLogic.generateNPCOccupation(age);
                family.push({
                    id,
                    name: `${getName('female')} ${lastName}`,
                    age, // Age at player birth
                    type: 'Mother',
                    gender: 'female',
                    status: getInt(70, 100),
                    category: 'family',
                    appearance: AvatarLogic.generateRandomAppearance(id, 'female'),
                    ...occ
                });
            }

            if (hasFather) {
                const id = getUUID();
                const age = getInt(18, 50);
                const occ = GameLogic.generateNPCOccupation(age);
                family.push({
                    id,
                    name: `${getName('male')} ${lastName}`,
                    age, // Age at player birth
                    type: 'Father',
                    gender: 'male',
                    status: getInt(70, 100),
                    category: 'family',
                    appearance: AvatarLogic.generateRandomAppearance(id, 'male'),
                    ...occ
                });
            }

            // --- B. SIBLING GENERATION ---
            // Logic Gate: Siblings generally require at least one known parent in this context.
            if (hasMother || hasFather) {
                const siblingRoll = Math.random();
                let siblingCount = 0;
                
                if (siblingRoll < 0.40) siblingCount = 1;      // 40% chance of 1 sibling
                else if (siblingRoll < 0.60) siblingCount = 2; // 20% chance of 2 siblings
                else if (siblingRoll < 0.70) siblingCount = 3; // 10% chance of 3 siblings
                // Base case: 30% chance of 0 siblings.

                const motherAge = family.find(f => f.type === 'Mother')?.age;
                const fatherAge = family.find(f => f.type === 'Father')?.age;
                const minParentAge = Math.min(...[motherAge, fatherAge].filter(Boolean));
                const maxSiblingAge = Math.min(15, (minParentAge || 30) - 16);

                if (maxSiblingAge >= 1) {
                    for (let i = 0; i < siblingCount; i++) {
                        const isMale = Math.random() > 0.5;
                        const id = getUUID();
                        const age = getInt(1, maxSiblingAge);
                        const occ = GameLogic.generateNPCOccupation(age);
                        family.push({
                            id,
                            name: `${getName(isMale ? 'male' : 'female')} ${lastName}`,
                            age, // Siblings are strictly older than the Age 0 player
                            type: isMale ? 'Brother' : 'Sister',
                            gender: isMale ? 'male' : 'female',
                            status: getInt(50, 100),
                            category: 'family',
                            appearance: AvatarLogic.generateRandomAppearance(id, isMale ? 'male' : 'female'),
                            ...occ
                        });
                    }
                }
            }

            return family;
        }
    };
})();