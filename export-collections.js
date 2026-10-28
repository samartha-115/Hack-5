// Export collections for easy one-click import into MongoDB Compass
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

fs.writeFileSync(path.join(__dirname, 'data', 'users.json'), JSON.stringify(db.users, null, 2), 'utf8');
fs.writeFileSync(path.join(__dirname, 'data', 'rooms.json'), JSON.stringify(db.rooms, null, 2), 'utf8');

console.log('✓ Created data/users.json (' + db.users.length + ' documents)');
console.log('✓ Created data/rooms.json (' + db.rooms.length + ' documents)');
