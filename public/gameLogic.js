function sanitizeName(rawInput) {
if (!rawInput) return { isValid: false, error: "Name cannot be empty." };

    // Clean it (Trim spaces)
    const cleanedName = rawInput.trim().replace(/\s+/g, ' ');
    const nameRegex = /^[a-zA-Z\s-]+$/;

    // Check Rules
    if (cleanedName === "") {
        return { isValid: false, error: "You must enter a name to begin." };
    }
    if (cleanedName.length > 25) {
        return { isValid: false, error: "Keep the name to 25 characters or less." };
    }
    if (!nameRegex.test(cleanedName)) {
        return { isValid: false, error: "Name can only contain letters, spaces, and hyphens." };
    }

    // Success!
    return { isValid: true, cleanedName: cleanedName };
}

function addLivingExpenses(age, currentlyStudent) {
    if (age >= 19 && !currentlyStudent) {
    return 24000; // $2k/month * 12
    }; 
    return 0;
}

function calculateBirthdayMoney() {
    return Math.floor(Math.random() * 71) + 10;
}

function addStudentLoanPayment(age, studentLoanAmount, isStudent) {
        if (age >= 18 && studentLoanAmount > 0 && !isStudent) {
            return Math.min(2400, studentLoanAmount);
        }
        return 0;
};

function checkSchoolGraduated(currentSchoolYear, enrolledSchoolYears) {
    return currentSchoolYear >= enrolledSchoolYears;
}

function checkLifeStatus(user) {
    if (user.gradSchoolEnrolled) {
       return `${user.gradSchoolType} Student`;
    } else if (user.universityEnrolled) {
       return "University Student";
    } else if (user.hasBusiness) {
       return "CEO & Founder";
    } else if (user.jobTitle) {
       return user.jobTitle;
    } else if (user.gradSchoolDegree) {
       return `${user.gradSchoolDegree} Graduate`;
    } else if (user.universityGraduated) {
       return "University Graduate";
    } else if (user.age > 17 && user.highSchoolRetained) {
       return "Student (Retaking)";
    } else if (user.age > 17 && !user.jobTitle) {
       return "Unemployed";
    } else if (user.age === 0) {
       return "Baby";
    } else if (user.age < 5) {
       return "Toddler";
    } else if (user.age < 18) {
       return "Student";
    } else if (user.highSchoolRetained) {
       return "Student (Retaking)";
    }
}


const GameLogic = {
    sanitizeName,
    addLivingExpenses,
    calculateBirthdayMoney,
    addStudentLoanPayment,
    checkSchoolGraduated,
    checkLifeStatus
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLogic; // Node/Jest
} else if (typeof window !== 'undefined') {
    window.GameLogic = GameLogic; // Browser
}