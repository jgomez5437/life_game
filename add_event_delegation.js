import fs from 'fs';
import path from 'path';

const handlersList = [
  'login',
  'startGuestMode',
  'renderVehicleManager',
  'renderLifeDashboard',
  'renderShoppingHub',
  'renderAssets',
  'repairVehicle',
  'sellVehicle',
  'renderVehicleDealer',
  'buyVehicle',
  'renderActivities',
  'processQuarter',
  'selectIndustry',
  'confirmQuitCareer',
  'quitCareer',
  'attemptEnrollment',
  'openGradEnrollmentModal',
  'attemptGradEnrollment',
  'enterBusinessMode',
  'renderEducation',
  'renderGradSchoolMarket',
  'openUniversityModal',
  'renderCareerManager',
  'renderJobMarket',
  'renderCareerMarket',
  'renderBusinessSetup',
  'selectGender',
  'submitCharacter',
  'continueAsChild',
  'ageUp',
  'renderRelationships',
  'renderPersonInteraction',
  'openRelationshipConfirm'
];

let mainContent = fs.readFileSync('public/src/core/main.js', 'utf8');

const eventDelegationCode = `
const routeHandlers = {
  ${handlersList.join(',\n  ')}
};

document.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (actionElement) {
        const action = actionElement.dataset.action;
        const argsStr = actionElement.dataset.args;
        let args = [];
        if (argsStr !== undefined && argsStr !== null && argsStr.trim() !== '') {
            args = argsStr.split(',').map(s => {
                let t = s.trim();
                // strip quotes
                if (t.startsWith("'") && t.endsWith("'")) t = t.slice(1, -1);
                else if (t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
                return isNaN(t) ? t : Number(t);
            });
        }
        if (routeHandlers[action]) {
            routeHandlers[action](...args);
        } else {
            console.warn('Unhandled action:', action);
        }
    }
});
`;

mainContent += '\\n' + eventDelegationCode;

// write back
fs.writeFileSync('public/src/core/main.js', mainContent);
console.log('Event delegation added to main.js');
