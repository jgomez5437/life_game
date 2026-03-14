window.FamilyFactory = (() => {
    // 1. Static Name Dictionaries
    // Future Architecture Note: Move these to a separate JSON config file when implementing regional variants.
    const NAMES = {
        MALE: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth'],
        FEMALE: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle']
    };

    // 2. Pure Helper Functions (Isolated to this factory)
    const getInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getName = (gender) => NAMES[gender][Math.floor(Math.random() * NAMES[gender].length)];
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
                family.push({
                    id: getUUID(),
                    name: `${getName('FEMALE')} ${lastName}`,
                    age: getInt(18, 45), // Age at player birth
                    type: 'Mother',
                    status: getInt(70, 100),
                    category: 'family'
                });
            }

            if (hasFather) {
                family.push({
                    id: getUUID(),
                    name: `${getName('MALE')} ${lastName}`,
                    age: getInt(18, 50), // Age at player birth
                    type: 'Father',
                    status: getInt(70, 100),
                    category: 'family'
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

                for (let i = 0; i < siblingCount; i++) {
                    const isMale = Math.random() > 0.5;
                    family.push({
                        id: getUUID(),
                        name: `${getName(isMale ? 'MALE' : 'FEMALE')} ${lastName}`,
                        age: getInt(1, 15), // Siblings are strictly older than the Age 0 player
                        type: isMale ? 'Brother' : 'Sister',
                        status: getInt(50, 100),
                        category: 'family'
                    });
                }
            }

            return family;
        }
    };
})();