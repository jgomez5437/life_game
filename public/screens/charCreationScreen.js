//Character creation screen
let selectedGender = 'male';
const CITIES = ["New York", "London", "Tokyo", "Berlin", "San Francisco"];

window.renderCharCreation = () => {
    const creationHTML = `
            <div class="fade-in max-w-md mx-auto mt-10">
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

function sanitizeName() {
    console.log("sanitizeName")
    const nameRegex = /^[a-zA-Z\s-]+$/;
    const inputName = get('inp-name').value;
    const name = inputName.trim().replace(/\s+/g, ' ');
    try{
        if (name === "") {
            window.UI.showModal("Wait!", "You must enter a name to begin.")
            return;
        };
        if (name.length > 25) {
            window.UI.showModal("Whoa!", "Keep the name to 25 characters or less.")
            return;
        }
        if (!nameRegex.test(name)) {
            window.UI.showModal("Invalid Name", "Name can only contain letters, spaces, and hyphens.")
            return;
        }
        return name;
    } catch (error) {
        console.error("Validation error:", error)
        return null;;
    }
};


async function submitCharacter() {
    const name = sanitizeName();
    if (!name) return;
    const gender = selectedGender;
    const city = get('inp-city').value;
    const tempAuthId = "user_" + Math.random().toString(36).substr(2, 9);
    try {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            auth0_id: tempAuthId,
            username: name,
            gender: gender,
            city: city
        })
    });
    if (!response.ok) throw new Error('API Login Failed')
    
    const userData = await response.json();
    window.loadAndRenderGame(userData);
    window.renderLifeDashboard(window.gameState);
    } catch (error) {
        console.error("Creation failed", error);
        window.UI.showModal("Error", "Failed to create character. Check your console/server.")
    }
};