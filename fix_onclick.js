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

// Map functions to data-action handlers
let handlers = new Set();

walkSync(SRC_DIR, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');

    // Find and replace onclick="..." with data-action="..." and extract arguments
    content = content.replace(/onclick="([a-zA-Z0-9_]+)\((.*?)\)"/g, (match, funcName, args) => {
        handlers.add(funcName);
        let replacement = `data-action="${funcName}"`;
        if (args && args.trim()) {
            // handle multiple args by separating or just shoving into a single string
            // Note: simple args like '1', '2' or string literals ''
            const cleanArgs = args.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
            replacement += ` data-args="${cleanArgs}"`;
        }
        return replacement;
    });

    fs.writeFileSync(filePath, content);
});

console.log('Fixed onclicks. Functions to handle:', Array.from(handlers));
