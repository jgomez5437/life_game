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
    const lines = content.split('\n');
    const seenImports = new Set();
    const newLines = [];
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('import ')) {
            // Very simple deduplication: check exact string match
            // To be more robust, check the exact line content
            if (seenImports.has(line)) {
                modified = true;
                continue; // Skip this line
            }
            seenImports.add(line);
        }
        newLines.push(lines[i]); // Push original line (with newlines/spacing intact)
    }

    if (modified) {
        fs.writeFileSync(filePath, newLines.join('\n'));
        console.log('Deduped imports in', filePath);
    }
});
