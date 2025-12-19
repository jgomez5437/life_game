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

const GameLogic = {
    sanitizeName
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLogic; // Node/Jest
} else if (typeof window !== 'undefined') {
    window.GameLogic = GameLogic; // Browser
}