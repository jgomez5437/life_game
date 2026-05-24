import { usePlayerStore } from '@/features/player/usePlayerStore';
import { triggerRandomEvent } from '@/features/events/randomEvents';
import {
    checkMortality,
    calculateHealthDecay,
    addLivingExpenses,
    calculateBirthdayMoney,
    addStudentLoanPayment,
    checkSchoolGraduated,
    simulateVehicleMarket,
    updateOwnedVehicles,
    checkLifeStatus,
} from '@/lib/gameLogic';
import { PlayerState, LifeEvent } from '@/types/player';
import { useUIStore } from '@/features/ui/useUIStore';

export function ageUpAction(bypassPipCheck = false) {
    const store = usePlayerStore.getState();
    const currentState = store; // we'll read from here

    // 1. PIP Check (must be async flow before mortality if triggered)
    if (!bypassPipCheck && currentState.jobTitle && currentState.jobPerformance <= 20 && !currentState.hasJobWarning) {
        useUIStore.getState().showConfirm(
            "Your boss wants to put you on a Performance Improvement Plan (PIP). Accept to reset your performance to 50%, or refuse and risk being fired next year.",
            () => {
                usePlayerStore.setState({ jobPerformance: 50, hasJobWarning: false });
                usePlayerStore.getState().addLog("You accepted a Performance Improvement Plan to save your job.", 'bad');
                ageUpAction(true);
            },
            () => {
                usePlayerStore.setState({ hasJobWarning: true });
                usePlayerStore.getState().addLog("You refused your boss's Performance Improvement Plan. Your job is on thin ice.", 'major');
                ageUpAction(true);
            },
            "Performance Warning"
        );
        return; // Pause the age up flow
    }

    // 2. Mortality Check
    const deathCheck = checkMortality(currentState.age, currentState.health);
    if (deathCheck.isDead) {
        handleDeath(currentState, deathCheck.cause!);
        return;
    }

    // Prepare a clone for batch update
    const draft: Partial<PlayerState> = { ...currentState };
    // We will collect logs and add them at the end.
    const yearLogs: LifeEvent[] = [];

    const addLog = (msg: string, type: 'good' | 'bad' | 'neutral' | 'major' = 'neutral') => {
        let color = 'text-slate-400';
        if (type === 'good') color = 'text-green-400';
        else if (type === 'bad') color = 'text-red-400';
        else if (type === 'major') color = 'text-yellow-400 font-bold';
        
        yearLogs.push({ msg, color });
    };

    // 3. The Core Update
    draft.age = currentState.age + 1;
    const currentAge = draft.age;

    // Reset Job/School actions
    draft.jobActions = 0;
    draft.schoolActions = 0;
    draft.parentsTried = false;
    draft.scholarshipTried = false;

    // Job Consequences
    if (draft.jobTitle) {
        if (draft.jobPerformance! <= 20 && draft.hasJobWarning) {
            addLog(`You were fired from your job as a ${draft.jobTitle} due to poor performance.`, 'bad');
            draft.jobTitle = '';
            draft.jobSalary = 0;
            draft.hasJobWarning = false;
        } else if (draft.jobPerformance! > 85) {
            const raise = Math.floor(draft.jobSalary! * 0.05);
            draft.jobSalary = draft.jobSalary! + raise;
            addLog(`You got a 5% raise! New salary: $${draft.jobSalary.toLocaleString()}`, 'good');
        }
    }

    // 4. Sub-Systems
    
    // --- Health ---
    const decay = calculateHealthDecay(currentAge);
    draft.health = Math.max(0, currentState.health - decay);
    if (currentState.health >= 30 && draft.health < 30) {
        addLog("Your health has reached a critical low. Your risk of death is severely elevated.", "major");
    }

    // --- Finances ---
    if (currentAge >= 5 && currentAge <= 18) {
        const bdayMoney = calculateBirthdayMoney();
        draft.money = (draft.money || 0) + bdayMoney;
        addLog(`You received $${bdayMoney} for your birthday!`, 'good');
    }
    if (draft.jobTitle) {
        draft.money = (draft.money || 0) + draft.jobSalary!;
        if (draft.hasSeenJobSalary) {
            addLog(`Earned $${draft.jobSalary?.toLocaleString()} as a ${draft.jobTitle}.`, 'good');
        }
    }
    const livingExpense = addLivingExpenses(currentAge, !!draft.isStudent);
    if (livingExpense > 0) {
        draft.monthlyLivingExpense = livingExpense;
        draft.money = (draft.money || 0) - livingExpense;
        if (!draft.hasSeenExpenseMsg) {
            addLog("Your basic living expenses are $2,000 per month.", 'neutral');
            draft.hasSeenExpenseMsg = true;
        }
    }
    const studentLoanPayment = addStudentLoanPayment(currentAge, draft.studentLoans || 0, !!draft.isStudent);
    draft.monthlyOutflow = (draft.monthlyOutflow || 0) + studentLoanPayment;
    draft.studentLoans = (draft.studentLoans || 0) - studentLoanPayment;

    // --- Education ---
    if (currentAge === 18 || (currentAge === 19 && draft.highSchoolRetained)) {
        if ((draft.schoolPerformance || 0) > 25) {
            addLog("You graduated High School! Enroll in University or find a job.", 'good');
            draft.highSchoolRetained = false;
            draft.isStudent = false;
        } else {
            addLog("You failed. You must stay another year in High School.", 'bad');
            draft.highSchoolRetained = true;
            draft.isStudent = true;
        }
    } else if (currentAge === 20 && draft.highSchoolRetained) {
        addLog("Your high school took pity on you. You passed with a GED.", 'good');
        draft.highSchoolRetained = false;
        draft.isStudent = false;
    }

    if (draft.universityEnrolled) {
        draft.universitySchoolYear = (draft.universitySchoolYear || 0) + 1;
        if (checkSchoolGraduated(draft.universitySchoolYear, 4)) {
            draft.universityEnrolled = false;
            draft.isStudent = false;
            draft.universityGraduated = true;
            addLog(`You finished University with a degree in ${draft.major}.`, 'good');
        } else {
            addLog(`Completed year ${draft.universitySchoolYear} of University.`, 'neutral');
        }
    }

    if (draft.gradSchoolEnrolled) {
        draft.gradSchoolYear = (draft.gradSchoolYear || 0) + 1;
        // Mock years for grad school - ideally should look up from a constants file
        const schoolYears = draft.gradSchoolType?.includes('Medical') ? 4 : 2; 
        if (checkSchoolGraduated(draft.gradSchoolYear, schoolYears)) {
            draft.gradSchoolEnrolled = false;
            draft.isStudent = false;
            draft.gradSchoolDegree = draft.gradSchoolType;
            addLog(`Graduated from ${draft.gradSchoolType}!`, 'good');
        } else {
            addLog(`Completed year ${draft.gradSchoolYear} of ${draft.gradSchoolType}.`, 'neutral');
        }
    }

    if (currentAge === 12) addLog("Started Middle School.", 'good');
    if (currentAge === 14) addLog("Started High School.", 'good');

    // --- Market ---
    // Note: Vehicles logic requires fetching global VEHICLES_FOR_SALE, assuming it will be stored differently later.
    // For now we simulate the market and update owned assets.
    // Mock global market for now to keep gameLogic pure
    const mockVehicles = [{ price: 20000 }];
    const marketForce = simulateVehicleMarket(mockVehicles);
    if (draft.assets) {
        const { updatedAssets, warnings } = updateOwnedVehicles(draft.assets, marketForce);
        draft.assets = updatedAssets;
        warnings.forEach(w => addLog(w.msg, w.type));
    }

    if (marketForce > 0.06 && currentAge > 15) {
        addLog("Inflation hits the auto market! Car prices are up.", "bad");
    } else if (marketForce < -0.06 && currentAge > 15) {
        addLog("Auto market crash! Vehicle prices are down.", "good");
    }

    // --- Life Events ---
    if (currentAge === 1) addLog("You've discovered building blocks.", 'good');
    else if (currentAge === 2) addLog("You learned to walk.", 'good');
    else if (currentAge === 3) addLog("You drew on the walls.", 'good');
    else if (currentAge === 5) addLog("Started Elementary School!", 'good');
    else if (currentAge < 18 && currentAge > 5) {
        if (currentAge === 15) addLog("Legal working age reached.", 'neutral');
        
        const roll = Math.random();
        if (roll < 0.2) {
            const gift = Math.floor(Math.random() * 20) + 5;
            draft.money = (draft.money || 0) + gift;
            addLog(`Found $${gift} on the sidewalk!`, 'good');
        } else if (roll > 0.9) {
            addLog("Got the flu. Stayed home for a week.", 'bad');
        }
    } 
    else if (!draft.highSchoolRetained && !draft.jobTitle && !draft.hasBusiness && !draft.universityEnrolled && currentAge >= 18 && currentAge < 65) {
         addLog("Unemployed. Savings are dwindling.", 'bad');
    }

    // --- Relationships ---
    if (draft.relationships) {
        draft.relationships = draft.relationships.map(rel => ({
            ...rel,
            age: (rel.age || 0) + 1
        }));
    }

    // 4. Empty Year Validation
    if (yearLogs.length === 0) {
        addLog("You didn't do much all year.", 'neutral');
    }

    // 5. Random Events
    triggerRandomEvent(draft, addLog);

    // 6. Recalculate Life Status
    draft.lifeStatus = checkLifeStatus(draft as PlayerState);

    // Apply the update
    usePlayerStore.setState((state) => {
        return {
            ...state,
            ...draft,
            lifeLog: [
                ...state.lifeLog,
                { age: currentAge, events: yearLogs }
            ]
        };
    });
}

function handleDeath(state: PlayerState, cause: string) {
    usePlayerStore.setState({
        isDead: true,
        lifeStatus: "Deceased",
        deathCause: cause,
    });
    
    usePlayerStore.getState().addLog(`You died at age ${state.age} from ${cause}`, 'bad');
}
