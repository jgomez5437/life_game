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

// 1. Collect all expected imports from all files
const expectedExports = {}; // map of filePath -> Set of identifiers needed

walkSync(SRC_DIR, (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const identifiers = match[1].split(',').map(s => s.trim()).filter(Boolean);
        let importPath = match[2];
        
        // resolve import path relative to filePath
        let absoluteImportPath = path.resolve(path.dirname(filePath), importPath);
        
        // convert to relative to root for our map (or just keep absolute)
        if (!expectedExports[absoluteImportPath]) {
            expectedExports[absoluteImportPath] = new Set();
        }
        identifiers.forEach(id => expectedExports[absoluteImportPath].add(id));
    }
});

// 2. Scan the source files and add exports if missing
for (const [absPath, neededIds] of Object.entries(expectedExports)) {
    if (!fs.existsSync(absPath)) {
        console.log("File not found:", absPath);
        continue;
    }
    
    let content = fs.readFileSync(absPath, 'utf8');
    let modified = false;
    
    neededIds.forEach(id => {
        // Check if already exported
        const isExportedRegex = new RegExp(`export\\s+(?:async\\s+)?(?:const|let|var|function)\\s+${id}\\b`);
        if (isExportedRegex.test(content)) {
            return; // Already exported
        }
        
        // Check if exported as 'export { id }' (simple check)
        if (content.includes(`export { ${id} }`) || content.includes(`export {${id}}`)) {
            return;
        }

        // Try to find function declaration
        const funcRegex = new RegExp(`^(async\\s+)?function\\s+${id}\\s*\\(`, 'm');
        if (funcRegex.test(content)) {
            content = content.replace(funcRegex, `export $1function ${id}(`);
            modified = true;
            console.log(`Added export to function ${id} in ${absPath}`);
            return;
        }

        // Try to find const/let declaration
        const varRegex = new RegExp(`^(const|let|var)\\s+${id}\\s*=`, 'm');
        if (varRegex.test(content)) {
            content = content.replace(varRegex, `export $1 ${id} =`);
            modified = true;
            console.log(`Added export to ${id} in ${absPath}`);
            return;
        }
        
        // If we reach here, we couldn't find the declaration, or it's implicitly global.
        console.log(`Warning: Could not find declaration to export for '${id}' in ${absPath}`);
    });

    if (modified) {
        fs.writeFileSync(absPath, content);
    }
}
