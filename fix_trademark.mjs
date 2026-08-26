import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/<strong>Trademark Notice:<\/strong> NDEB[\s\S]*? are registered trademarks/g, '<strong>Trademark Notice:</strong> NDEB&reg; and AFK&reg; are registered trademarks');
fs.writeFileSync('src/App.tsx', code, 'utf8');