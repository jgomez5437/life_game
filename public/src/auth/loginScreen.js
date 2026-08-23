import { renderCharCreation } from '../features/player/charCreationScreen.js';
import { UI } from '../ui/ui.js';

export const renderLoginScreen = () => {
    UI.resetHeader();
    const container = document.getElementById('game-container');
    
    const html = `
    <div class="h-full flex flex-col items-center justify-center fade-in text-center p-6">
        
        <div class="mb-8 relative">
            <div class="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full"></div>
            <i class="fas fa-globe-americas text-8xl text-blue-400 relative z-10 animate-pulse"></i>
        </div>

        <h1 class="text-5xl font-bold text-white mb-2 tracking-tight">Start a Life</h1>
        <p class="text-slate-300 text-lg mb-10 max-w-xs mx-auto font-medium">
            Live a customized life. Make choices. Leave a legacy.
        </p>

        <div class="w-full max-w-xs space-y-3">
            
            <button data-action="login" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/50 transition-all flex items-center justify-center gap-3">
                <i class="fas fa-cloud"></i>
                <span>Cloud Save / Login</span>
            </button>

            <button data-action="startGuestMode" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-4 rounded-xl border border-slate-700 transition-all">
                Play as Guest
            </button>

            <div class="grid grid-cols-2 gap-2">
                <a href="/about" class="bg-slate-800/80 hover:bg-slate-700 text-blue-300 font-semibold py-3 rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-1.5 text-xs md:text-sm">
                    <svg class="inline-block fill-currentColor align-middle" viewBox="0 0 24 24" width="1.1em" height="1.1em"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/></svg>
                    <span>About</span>
                </a>
                <a href="/how-to-play" class="bg-slate-800/80 hover:bg-slate-700 text-blue-300 font-semibold py-3 rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-1.5 text-xs md:text-sm">
                    <svg class="inline-block fill-currentColor align-middle" viewBox="0 0 24 24" width="1.1em" height="1.1em"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" fill="currentColor"/></svg>
                    <span>How to Play</span>
                </a>
            </div>
        </div>
        
        <div class="mt-8 text-xs text-slate-300 font-medium">
            © 2026 Start a Life • v1.2.5
        </div>
    </div>
    `;

    UI.hideBottomNav();
    UI.renderScreen(html);
}

// Add this small helper for guests
export function startGuestMode() {
    console.log("Starting as guest...");
    renderCharCreation();
}