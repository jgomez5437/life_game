import fs from 'fs';

const filePath = 'public/src/features/career/occupationScreen.js';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('import { MAJORS, CAREERS, PART_TIME_JOBS }')) {
    content = content.replace("import { Utils } from '../../ui/utils.js';", "import { Utils } from '../../ui/utils.js';\nimport { MAJORS, CAREERS, PART_TIME_JOBS } from '../../core/main.js';");
}

content = content.replace(/const GRAD_SCHOOLS = \[\s*{\s*name: "Law School"/, 'export const GRAD_SCHOOLS = [\n    { name: "Law School"');
content = content.replace("]\nwindow.GRAD_SCHOOLS = GRAD_SCHOOLS;", "];");
content = content.replace("]\r\nwindow.GRAD_SCHOOLS = GRAD_SCHOOLS;", "];");

fs.writeFileSync(filePath, content);
console.log("Fixed occupationScreen.js");
