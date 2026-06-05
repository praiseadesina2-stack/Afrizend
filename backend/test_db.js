const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./afrizend.db');
db.all("PRAGMA table_info(users);", (err, rows) => {
  if (err) console.error(err);
  else console.log(rows.map(r => r.name));
});
