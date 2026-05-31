import fs from 'fs';
import path from 'path';

const SRC_DIR = 'public/src';

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && filePath.endsWith('.js')) {
            callback(filePath);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

walkSync(SRC_DIR, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it uses get('...') or get("...")
    if (/\bget\(['"]/.test(content)) {
        // If it doesn't already define get or import get
        if (!content.includes('const get =') && !content.includes('import { get }') && !content.includes('import {get}')) {
            // Find where to insert it (after imports)
            const lines = content.split('\n');
            let lastImportIndex = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('import ')) {
                    lastImportIndex = i;
                }
            }
            
            lines.splice(lastImportIndex + 1, 0, '\nconst get = id => document.getElementById(id);');
            fs.writeFileSync(filePath, lines.join('\n'));
            console.log(`Injected get into ${filePath}`);
        }
    }
});
