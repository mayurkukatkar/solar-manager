const fs = require('fs');

const serverFile = 'f:/Company Products/solar-manager/backend/server.js';
let lines = fs.readFileSync(serverFile, 'utf8').split('\n');

const startIdx = lines.findIndex(line => line.includes('// 3. Get All Tenants'));
const endIdx = lines.findIndex(line => line.includes('// TENANT ADMIN - DASHBOARD KPIs'));

if (startIdx !== -1 && endIdx !== -1) {
    const importCode = `const superAdminRoutes = require('./routes/admin/superAdmin');\napp.use('/api/super-admin', superAdminRoutes);`;
    lines.splice(startIdx, endIdx - startIdx, importCode);
    fs.writeFileSync(serverFile, lines.join('\n'));
    console.log('Successfully replaced Super Admin routes');
} else {
    console.error('Could not find start or end index', startIdx, endIdx);
}
