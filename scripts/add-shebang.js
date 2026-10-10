import { readFileSync, writeFileSync } from 'fs';

const file = 'dist/index.js';
let content = readFileSync(file, 'utf-8');
if (!content.startsWith('#!')) {
    content = '#!/usr/bin/env node\n' + content;
    writeFileSync(file, content);
}
