const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./afrizend.db');

const columns = [
  "ALTER TABLE users ADD COLUMN currency TEXT DEFAULT 'NGN'",
  "ALTER TABLE users ADD COLUMN virtual_account_number TEXT",
  "ALTER TABLE users ADD COLUMN virtual_bank_name TEXT",
  "ALTER TABLE users ADD COLUMN virtual_account_reference TEXT"
];

db.serialize(() => {
  for (const query of columns) {
    db.run(query, (err) => {
      if (err) {
        if (!err.message.includes('duplicate column name')) {
          console.error(`Error executing ${query}:`, err.message);
        } else {
          console.log(`Column already exists: ${query}`);
        }
      } else {
        console.log(`Successfully executed: ${query}`);
      }
    });
  }
});
