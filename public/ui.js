const _elements = {
    name: document.getElementById('header-name'),
    age: document.getElementById('header-age'),
    bank: document.getElementById('header-bank'),
    healthText: document.getElementById('ui-health'),
    healthContainer: document.getElementById('health-container'),
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
    /** * @param {Object} stats - { username, age, money, city, health }
     */
    updateHeader: (stats) => {
        // 1. NAME & FLAG UPDATE
        const displayName = stats.username || stats.name || "Player";
        const countryCode = window.Utils.getCountryCode(stats.city);
        
        let flagHtml = "";
        
        if (countryCode) {
            flagHtml = `<img src="https://flagcdn.com/w20/${countryCode}.png" 
                             srcset="https://flagcdn.com/w40/${countryCode}.png 2x" 
                             width="20" 
                             alt="${stats.city}" 
                             class="ml-2 inline-block shadow-sm rounded-sm" 
                             style="vertical-align: text-bottom;">`;
        }

        _elements.name.innerHTML = `${displayName} ${flagHtml}`;

        // 2. AGE UPDATE
        if (stats.age !== undefined) _elements.age.innerText = stats.age;

        // 3. HEALTH UPDATE
        if (stats.health !== undefined && _elements.healthText && _elements.healthContainer) {
            _elements.healthText.innerText = `${stats.health}%`;
            
            _elements.healthContainer.classList.remove('text-green-400', 'text-yellow-400', 'text-red-500');
            if (stats.health > 70) {
                _elements.healthContainer.classList.add('text-green-400');
            } else if (stats.health > 30) {
                _elements.healthContainer.classList.add('text-yellow-400');
            } else {
                _elements.healthContainer.classList.add('text-red-500');
            }
        }

        // 4. BANK UPDATE
        if (stats.money !== undefined) {
            _elements.bank.innerText = window.Utils.formatMoney(stats.money);
            
            _elements.bank.classList.remove('text-green-400', 'text-red-400');
            if (stats.money < 0) {
                _elements.bank.classList.add('text-red-400');
            } else {
                _elements.bank.classList.add('text-green-400');
            }
        }
    },

    /**
     * @param {string} htmlContent
     */
    renderScreen: (htmlContent) => {
        _elements.gameContainer.innerHTML = htmlContent;
    },

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
            _elements.modalOverlay.classList.add('hidden');
            _elements.modalOverlay.classList.remove('flex');
            if (onClose) onClose();
        }

        _elements.modalOverlay.classList.remove('hidden');
        _elements.modalOverlay.classList.add('flex');
    },

    /**
     * @param {string} title
     * @param {string} message 
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