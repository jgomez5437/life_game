//Character creation screen
let selectedGender = 'male';
const CITIES = ["New York", "Los Angeles", "San Francisco", "Houston", "Miami", "Tucson", "London", "Osaka", "Tokyo", "Berlin", "Madrid", "Paris", "Beijing", "Toronto", "Mexico City", "Cairo"];

window.renderCharCreation = () => {
    const creationHTML = `
            <div class="fade-in max-w-md mx-auto h-full flex flex-col justify-center">
                <div class="text-center mb-8">
                    <i class="fas fa-baby text-6xl text-green-500 mb-4"></i>
                    <h2 class="text-3xl font-bold">New Life</h2>
                    <p class="text-slate-400">Design your destiny.</p>
                </div>
                <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl space-y-4">
                    <div>
                        <label class="block text-sm text-slate-400 mb-1">Full Name</label>
                        <input type="text" id="inp-name" class="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:border-blue-500 outline-none" placeholder="First and Last Name">
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-1">Gender</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="selectGender('male')" id="btn-male" class="p-3 rounded border border-blue-500 bg-blue-900/30 text-blue-200">Male</button>
                            <button onclick="selectGender('female')" id="btn-female" class="p-3 rounded border border-slate-600 bg-slate-900 text-slate-400">Female</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm text-slate-400 mb-1">Birth City</label>
                        <select id="inp-city" class="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white outline-none">
                            ${CITIES.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                    <button onclick="submitCharacter()" class="w-full btn-life text-white font-bold py-4 rounded-xl text-lg mt-4">
                        Start Life
                    </button>
                </div>
            </div>
        `;
        UI.renderScreen(creationHTML);
    }

function selectGender(g) {
    selectedGender = g
    console.log(selectedGender)
    if(g === 'male') {
        get('btn-male').className = "p-3 rounded border border-blue-500 bg-blue-900/30 text-blue-200";
        get('btn-female').className = "p-3 rounded border border-slate-600 bg-slate-900 text-slate-400";
    } else {
        get('btn-male').className = "p-3 rounded border border-slate-600 bg-slate-900 text-slate-400";
        get('btn-female').className = "p-3 rounded border border-pink-500 bg-pink-900/30 text-pink-200";
    } 

};

async function submitCharacter() {
    // 1. Safely check for user
    let user = null;
    if (window.auth0Client) {
        try { user = await window.auth0Client.getUser(); } catch (e) {}
    }

    const inputName = get('inp-name').value;
    const validation = window.GameLogic.sanitizeName(inputName);

    if (!validation.isValid) {
        window.UI.showModal("Wait", validation.error);
        return;
    };
    
    const finalName = validation.cleanedName;
    if (!finalName) return;
    
    const gender = selectedGender;
    const city = get('inp-city').value;

    // We declare this outside so both "Guest" and "User" logic can fill it
    let userData; 

    try {
        // === IF USER IS LOGGED IN ===
        if (user) {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    auth0_id: user.sub,
                    email: user.email,
                    username: finalName,
                    gender: gender,
                    city: city
                })
            });
            if (!response.ok) throw new Error('API Login Failed');
            
            // Get data from Database
            userData = await response.json(); 
            window.updateGameInfo(userData);
            window.renderLifeDashboard(window.gameState);
        } 
        
        // === IF GUEST (Band-Aid Fix) ===
        else {
            // Manually build the object that your DB normally sends back
            // vital: Make sure this structure matches your DB columns/response exactly!
            userData = {
                username: finalName,
                gender: gender,
                city: city,
                // Add default starting stats here manually since the server isn't doing it
                stats: { 
                    health: 100, 
                    money: 0 
                },
                is_guest: true
            };
            window.loadAndRenderGame(userData);
            window.renderLifeDashboard(window.gameState);
        }

        // === COMMON GAME START ===
        // This now works for both because userData is guaranteed to exist

    } catch (error) {
        console.error("Creation failed", error);
        window.UI.showModal("Error", "Failed to create character.");
    }
};
