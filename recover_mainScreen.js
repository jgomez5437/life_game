import fs from 'fs';

const original = fs.readFileSync('public/screens/mainScreen.js', 'utf8');

let newContent = original;

// 1. Specific replacements instead of blindly removing window.
newContent = newContent.replace(/window\.gameState/g, 'state.gameState');
newContent = newContent.replace(/window\.GameLogic/g, 'GameLogic');
newContent = newContent.replace(/window\.addLog/g, 'addLog');
newContent = newContent.replace(/window\.Utils/g, 'Utils');
newContent = newContent.replace(/window\.saveGame/g, 'saveGame');
newContent = newContent.replace(/window\.renderDeathScreen/g, 'renderDeathScreen');
newContent = newContent.replace(/window\.continueAsChild/g, 'continueAsChild');
newContent = newContent.replace(/window\.renderLifeDashboard/g, 'renderLifeDashboard');
newContent = newContent.replace(/window\.resetGame/g, 'resetGame');
newContent = newContent.replace(/window\.UI/g, 'UI');
newContent = newContent.replace(/window\.GRAD_SCHOOLS/g, 'GRAD_SCHOOLS');

// 2. Add imports
const imports = `import { GameLogic } from '../../core/gameLogic.js';
import { state } from '../../core/state.js';
import { renderActivities } from '../career/occupationScreen.js';
import { renderRelationships } from '../relationships/relationshipScreen.js';
import { Utils } from '../../ui/utils.js';
import { UI } from '../../ui/ui.js';
import { renderAssets } from '../assets/assetsScreen.js';
const get = id => document.getElementById(id);
`;

// 3. Fix exports
newContent = newContent.replace('function ageUp()', 'export function ageUp()');
newContent = newContent.replace('renderDeathScreen = async function', 'export async function renderDeathScreen');
newContent = newContent.replace('continueAsChild = (', 'export const continueAsChild = (');
newContent = newContent.replace('renderLifeDashboard = (', 'export const renderLifeDashboard = (');
newContent = newContent.replace('addLog = (', 'export const addLog = (');

// 4. Fix state variable shadowing
// Original had: const state = window.gameState; -> now it is const state = state.gameState;
newContent = newContent.replace('const state = state.gameState;', 'const currentState = state.gameState;');
newContent = newContent.replace('const state = maybeGameState || state.gameState;', 'const currentState = maybeGameState || state.gameState;');
newContent = newContent.replace('renderLifeDashboard(state)', 'renderLifeDashboard(currentState)');
newContent = newContent.replace(/state\.lifeLog/g, 'currentState.lifeLog');
newContent = newContent.replace(/state\.user/g, 'currentState.user');

// Oh wait, if I blindly replace state.lifeLog to currentState.lifeLog, 
// I might break state.gameState.lifeLog because it would become currentState.gamecurrentState.lifeLog? No, 'state.gameState' won't match 'state.lifeLog'.
// Let's be safer.

// 5. Convert onclick to data-action
const onclickRegex = /onclick="([a-zA-Z0-9_]+)\(([^)]*)\)"/g;
newContent = newContent.replace(onclickRegex, (match, funcName, args) => {
    let newArgs = args.trim();
    if (newArgs.length > 0) {
        return `data-action="${funcName}" data-args="${newArgs.replace(/"/g, '&quot;').replace(/'/g, '&apos;')}"`;
    }
    return `data-action="${funcName}"`;
});

// Write to the new location
const finalContent = imports + '\n' + newContent;
fs.writeFileSync('public/src/features/player/mainScreen.js', finalContent);
console.log("Recovered mainScreen.js!");
