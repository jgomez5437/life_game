import fs from 'fs';
import path from 'path';

const SRC_DIR = 'public/src';

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && filePath.endsWith('.js')) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

// Map of exported symbols to their file path relative to SRC_DIR
const exportsMap = {};

// First pass: collect exports manually or with regex
walkSync(SRC_DIR, (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    let relativePath = filePath.substring(SRC_DIR.length);
    if (relativePath.startsWith('/') || relativePath.startsWith('\\')) relativePath = relativePath.substring(1);
    
    // Find 'export function x' and 'export const x'
    const exportRegex = /export\s+(?:function|const|let)\s+([a-zA-Z0-9_]+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
        exportsMap[match[1]] = relativePath.replace(/\\/g, '/');
    }
});

// Hardcode some known object exports if not picked up by regex
exportsMap['Utils'] = 'ui/utils.js';
exportsMap['UI'] = 'ui/ui.js';
exportsMap['GameLogic'] = 'core/gameLogic.js';
exportsMap['state'] = 'core/state.js';
exportsMap['setGameState'] = 'core/state.js';
exportsMap['clearGameState'] = 'core/state.js';
exportsMap['router'] = 'core/router.js'; // if we exported default or named

console.log('Collected exports:', Object.keys(exportsMap).length);

// Second pass: replace usages and inject imports
walkSync(SRC_DIR, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let relativePath = filePath.substring(SRC_DIR.length);
    if (relativePath.startsWith('/') || relativePath.startsWith('\\')) relativePath = relativePath.substring(1);
    const currentDir = path.dirname(relativePath).replace(/\\/g, '/');

    // Make Utils, UI, GameLogic ES6 exported if they aren't
    if (relativePath.includes('utils.js') && !content.includes('export const Utils')) {
        content = content.replace('const Utils = {', 'export const Utils = {');
    }
    if (relativePath.includes('ui.js') && !content.includes('export const UI')) {
        content = content.replace('const UI = {', 'export const UI = {');
    }
    if (relativePath.includes('gameLogic.js') && !content.includes('export const GameLogic')) {
        content = content.replace('const GameLogic = {', 'export const GameLogic = {');
    }

    // Replace state usages
    content = content.replace(/window\.gameState/g, 'state.gameState');
    content = content.replace(/window\.userAuthId/g, 'state.userAuthId');
    content = content.replace(/window\.userEmail/g, 'state.userEmail');
    content = content.replace(/window\.auth0Client/g, 'state.auth0Client');

    // Replace window calls
    content = content.replace(/window\.([a-zA-Z0-9_]+)/g, (match, p1) => {
        if (exportsMap[p1] || ['Utils', 'UI', 'GameLogic'].includes(p1)) {
            return p1;
        }
        return match;
    });

    // Determine required imports
    const requiredImports = {}; // path -> set of symbols

    // Find all identifiers
    // Simple approach: just check if the exported symbol is in the file (whole word)
    for (const [symbol, sourcePath] of Object.entries(exportsMap)) {
        if (sourcePath === relativePath.replace(/\\/g, '/')) continue; // Don't import from self
        
        // Regex to check if symbol is used as a whole word
        const regex = new RegExp(`\\b${symbol}\\b`, 'g');
        if (regex.test(content)) {
            if (!requiredImports[sourcePath]) requiredImports[sourcePath] = new Set();
            requiredImports[sourcePath].add(symbol);
        }
    }

    // Build import statements
    let importStatements = '';
    for (const [sourcePath, symbols] of Object.entries(requiredImports)) {
        // Calculate relative path
        let relativeImportPath = path.relative(currentDir, sourcePath).replace(/\\/g, '/');
        if (!relativeImportPath.startsWith('.') && !relativeImportPath.startsWith('/')) {
            relativeImportPath = './' + relativeImportPath;
        }
        
        importStatements += `import { ${Array.from(symbols).join(', ')} } from '${relativeImportPath}';\n`;
    }

    if (importStatements.length > 0) {
        content = importStatements + '\n' + content;
    }

    fs.writeFileSync(filePath, content);
});

console.log('Fixes applied.');
