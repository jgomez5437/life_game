const _elements = {
    name: document.getElementById('header-name'),
    age: document.getElementById('header-age'),
    bank: document.getElementById('header-bank'),
    //Main container for pages
    gameContainer: document.getElementById('game-container'),
    //Modal Elements
    modalOverlay: document.getElementById('modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalContent: document.getElementById('modal-content'),
    modalBtn: document.getElementById('modal-btn'),
    modalActions: document.getElementById('modal-actions')
}

//Global UI object
window.UI = {
    /** * @param {Object} stats - { username, age, money, city }
    */
    updateHeader: (stats) => {
        // 1. NAME & FLAG UPDATE
        // Check for username or name (fallback to "Player" if missing)
        const displayName = stats.username || stats.name || "Player";
        
const countryCode = window.Utils.getCountryCode(stats.city);
        
        let flagHtml = "";
        
        if (countryCode) {
            // 2. Generate an IMG tag pointing to FlagCDN
            // w20 = width 20px (nice small size)
            flagHtml = `<img src="https://flagcdn.com/w20/${countryCode}.png" 
                             srcset="https://flagcdn.com/w40/${countryCode}.png 2x" 
                             width="20" 
                             alt="${stats.city}" 
                             class="ml-2 inline-block shadow-sm rounded-sm" 
                             style="vertical-align: text-bottom;">`;
        }

        // 3. Render
        _elements.name.innerHTML = `${displayName} ${flagHtml}`;

        // 2. AGE UPDATE
        if (stats.age !== undefined) _elements.age.innerText = stats.age;

        // 3. BANK UPDATE
        if (stats.money !== undefined) {
            _elements.bank.innerText = window.Utils.formatMoney(stats.money);
            
            // Apply color based on balance
            _elements.bank.classList.remove('text-green-400', 'text-red-400');
            if (stats.money < 0) {
                _elements.bank.classList.add('text-red-400');
            } else {
                _elements.bank.classList.add('text-green-400');
            }
        }
    },

    //Screen rendering functions
    /**
     * @param {string} htmlContent
     */
    renderScreen: (htmlContent) => {
        _elements.gameContainer.innerHTML = htmlContent;
    },

    //Modal functions
    /**
     * @param {string} title
     * @param {string} message
     * @param {function} onClose
     */
    showModal: (title, message, onClose = null) => {
        _elements.modalTitle.innerText = title;
        _elements.modalContent.innerHTML = message;
        
        _elements.modalActions.innerHTML = `
            <button id="modal-btn" class="w-full btn-primary text-white font-bold py-3 rounded-lg">Dismiss</button>
        `;

        const newDismissBtn = document.getElementById('modal-btn');
        
        newDismissBtn.onclick = () => {
            // Hide the overlay
            _elements.modalOverlay.classList.add('hidden');
            _elements.modalOverlay.classList.remove('flex');
            if (onClose) onClose();
        }

        // Show overlay
        _elements.modalOverlay.classList.remove('hidden');
        _elements.modalOverlay.classList.add('flex');
    }

    ,

    /**
     * Show a modal with Confirm and Cancel buttons
     * @param {string} title
     * @param {string} message - HTML allowed
     * @param {string} confirmText
     * @param {function} onConfirm
     */
    showConfirm: (title, message, confirmText, onConfirm) => {
        _elements.modalTitle.innerText = title;
        _elements.modalContent.innerHTML = message;

        _elements.modalActions.innerHTML = `
            <div class="w-full grid grid-cols-1 gap-2">
                <button id="modal-confirm" class="w-full btn-primary text-white font-bold py-3 rounded-lg">${confirmText}</button>
                <button id="modal-cancel" class="w-full border border-slate-700 text-slate-300 font-bold py-3 rounded-lg bg-slate-800">Cancel</button>
            </div>
        `;

        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');

        confirmBtn.onclick = () => {
            _elements.modalOverlay.classList.add('hidden');
            _elements.modalOverlay.classList.remove('flex');
            if (onConfirm) onConfirm();
        };

        cancelBtn.onclick = () => {
            _elements.modalOverlay.classList.add('hidden');
            _elements.modalOverlay.classList.remove('flex');
        };

        _elements.modalOverlay.classList.remove('hidden');
        _elements.modalOverlay.classList.add('flex');
    }
}