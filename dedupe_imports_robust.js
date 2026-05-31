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

walkSync(SRC_DIR, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We will extract all import lines, delete them, and then re-insert a unified block.
    const importLines = [];
    const restLines = [];
    
    const lines = content.split('\n');
    let insideImport = false;
    let importBuffer = '';

    for (let line of lines) {
        if (line.trim().startsWith('import ') || insideImport) {
            importBuffer += line + '\n';
            if (line.includes(';')) {
                importLines.push(importBuffer.trim());
                importBuffer = '';
                insideImport = false;
            } else {
                insideImport = true;
            }
        } else {
            // Drop empty lines at the very top of the file mixed with imports
            if (restLines.length === 0 && line.trim() === '') {
                continue;
            }
            restLines.push(line);
        }
    }

    if (importLines.length > 0) {
        // Parse the imports
        // structure: { 'path': Set<identifiers> }
        const importsByPath = {};
        
        for (let imp of importLines) {
            // Regex to match: import { a, b, c } from 'path';
            const match = imp.match(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
            if (match) {
                const identifiers = match[1].split(',').map(s => s.trim()).filter(s => s);
                const sourcePath = match[2];
                if (!importsByPath[sourcePath]) importsByPath[sourcePath] = new Set();
                identifiers.forEach(id => importsByPath[sourcePath].add(id));
            } else {
                // Not a destructured import or we couldn't parse it well. Just log it?
                // For safety we won't touch default imports right now
            }
        }

        // Reconstruct imports
        const newImports = [];
        for (const [sourcePath, idSet] of Object.entries(importsByPath)) {
            newImports.push(`import { ${Array.from(idSet).join(', ')} } from '${sourcePath}';`);
        }
        
        const newContent = newImports.join('\n') + '\n\n' + restLines.join('\n');
        
        if (newContent !== content) {
            fs.writeFileSync(filePath, newContent);
            console.log('Fixed imports in', filePath);
        }
    }
});
