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
    /** 
    *@param {Object} stats - { name, age, bank }
    */
   updateHeader: (stats) => {
    //update name and age
    if (stats.name !== undefined) _elements.name.innerText = stats.name;
    if (stats.age !== undefined) _elements.age.innerText = stats.age;
    //update bank
    if (stats.bank !== undefined) {
        const amount = Number(stats.bank);
        const formattedMoney = Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount);
    
    _elements.bank.innerText = formattedMoney;
    //apply color based on balance
    _elements.bank.classList.remove('text-green-400', 'text-red-400');
            if (amount < 0) {
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
} ,

//Modal functions
/**
 * @param {string} title
 * @param {string} message
 * @param {function} onClose
 */
showModal: (title, message, onClose = null) => {
    _elements.modalTitle.innerText = title;
    _elements.modalContent.innerHTML = message;
    _elements.modalBtn.innerText = 'Dismiss';
    //show overlay
    _elements.modalOverlay.classList.add('hidden');
    _elements.modalOverlay.classList.remove('flex');
    //hide overlay
    _elements.modalBtn.onclick = () => {
            // Hide the overlay
        _elements.modalOverlay.classList.add('hidden');
        _elements.modalOverlay.classList.remove('flex');
        if (onClose) onClose();
    }
}

}