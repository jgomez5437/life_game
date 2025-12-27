window.renderLoginScreen = () => {
    const container = document.getElementById('game-container');
    
    const html = `
    <div class="h-full flex flex-col items-center justify-center fade-in text-center p-6">
        
        <div class="mb-8 relative">
            <div class="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full"></div>
            <i class="fas fa-globe-americas text-8xl text-blue-400 relative z-10 animate-pulse"></i>
        </div>

        <h1 class="text-5xl font-bold text-white mb-2 tracking-tight">Start a Life</h1>
        <p class="text-slate-400 text-lg mb-10 max-w-xs mx-auto">
            Live a customized life. Make choices. Leave a legacy.
        </p>

        <div class="w-full max-w-xs space-y-3">
            
            <button onclick="login()" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center gap-3">
                <i class="fas fa-cloud"></i>
                <span>Cloud Save / Login</span>
            </button>

            <button onclick="startGuestMode()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl border border-slate-700 transition-all">
                Play as Guest
            </button>
            
        </div>
        
        <div class="mt-8 text-xs text-slate-500">
            v1.0.0 • Built with Vanilla JS & Auth0
        </div>
    </div>
    `;

    UI.renderScreen(html);
}

// Add this small helper for guests
function startGuestMode() {
    console.log("Starting as guest...");
    window.renderCharCreation();
}