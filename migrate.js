import fs from 'fs';
import path from 'path';

const SRC_DIR = 'public/src';
const DIRS = {
    core: 'core',
    ui: 'ui',
    auth: 'auth',
    player: 'features/player',
    career: 'features/career',
    business: 'features/business',
    education: 'features/education',
    assets: 'features/assets',
    relationships: 'features/relationships',
    activities: 'features/activities'
};

const FILE_MAP = {
    'public/gameLogic.js': DIRS.core,
    'public/script.js': DIRS.core,
    'public/ui.js': DIRS.ui,
    'public/utils.js': DIRS.ui,
    'public/auth.js': DIRS.auth,
    'public/screens/loginScreen.js': DIRS.auth,
    'public/screens/charCreationScreen.js': DIRS.player,
    'public/screens/mainScreen.js': DIRS.player,
    'public/screens/occupationScreen.js': DIRS.career,
    'public/screens/careerJobsScreen.js': DIRS.career,
    'public/screens/jobCareerManagerScreen.js': DIRS.career,
    'public/screens/partTimeJobsScreen.js': DIRS.career,
    'public/screens/businessDashboard.js': DIRS.business,
    'public/screens/createBusinessScreen.js': DIRS.business,
    'public/screens/manageEducationScreen.js': DIRS.education,
    'public/screens/assetsScreen.js': DIRS.assets,
    'public/screens/goShoppingScreen.js': DIRS.assets,
    'public/familyFactory.js': DIRS.relationships,
    'public/screens/relationshipScreen.js': DIRS.relationships,
    'public/screens/moreToDoScreen.js': DIRS.activities
};

// Create dirs
Object.values(DIRS).forEach(dir => {
    fs.mkdirSync(path.join(SRC_DIR, dir), { recursive: true });
});

// Process files
for (const [filePath, targetDir] of Object.entries(FILE_MAP)) {
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace window.func = function(...) with export function func(...)
    content = content.replace(/window\.([a-zA-Z0-9_]+)\s*=\s*(async\s+)?function\s*\((.*?)\)/g, 'export $2function $1($3)');
    content = content.replace(/window\.([a-zA-Z0-9_]+)\s*=\s*\(?(.*?)\)?\s*=>/g, 'export const $1 = ($2) =>');
    
    // Convert common JS exports
    content = content.replace(/if\s*\(typeof module !== 'undefined'.*/s, ''); // Remove commonjs tail

    const fileName = path.basename(filePath);
    let newPath = path.join(SRC_DIR, targetDir, fileName);
    
    // Rename script.js to main.js
    if (fileName === 'script.js') {
        newPath = path.join(SRC_DIR, targetDir, 'main.js');
    }

    fs.writeFileSync(newPath, content);
    console.log(`Moved and transformed ${filePath} to ${newPath}`);
}
