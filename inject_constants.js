import fs from 'fs';
import path from 'path';

const SRC_DIR = 'public/src';
const constants = ['MAJORS', 'CAREERS', 'PART_TIME_JOBS', 'INDUSTRIES', 'SUPPLIERS'];

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
    // Skip main.js
    if (filePath.replace(/\\/g, '/').endsWith('core/main.js')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let needed = [];
    
    constants.forEach(c => {
        // if the file uses the constant
        if (new RegExp(`\\b${c}\\b`).test(content)) {
            // Check if already imported
            const importRegex = new RegExp(`import\\s+\\{[^}]*\\b${c}\\b[^}]*\\}\\s+from`);
            if (!importRegex.test(content)) {
                needed.push(c);
            }
        }
    });

    if (needed.length > 0) {
        // determine relative path to core/main.js
        const dir = path.dirname(filePath);
        let relative = path.relative(dir, 'public/src/core/main.js').replace(/\\/g, '/');
        if (!relative.startsWith('.')) relative = './' + relative;

        const importStr = `import { ${needed.join(', ')} } from '${relative}';`;
        
        // Find last import
        const lines = content.split('\n');
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                lastImportIndex = i;
            }
        }
        
        lines.splice(lastImportIndex + 1, 0, importStr);
        fs.writeFileSync(filePath, lines.join('\n'));
        console.log(`Injected [${needed.join(', ')}] into ${filePath}`);
    }
});
