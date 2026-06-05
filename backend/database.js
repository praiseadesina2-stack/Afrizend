const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'afrizend.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      // Create Users Table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password_hash TEXT,
        role TEXT,
        wallet_address TEXT,
        trust_score REAL DEFAULT 0,
        balance REAL DEFAULT 0,
        company TEXT,
        bio TEXT,
        skills TEXT,
        hourly_rate REAL,
        currency TEXT DEFAULT 'NGN',
        virtual_account_number TEXT,
        virtual_bank_name TEXT,
        virtual_account_reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Create User Activities Table
      db.run(`CREATE TABLE IF NOT EXISTS user_activities (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action_type TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Create Jobs Table
      db.run(`CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        employer_id TEXT,
        title TEXT,
        description TEXT,
        budget REAL,
        currency TEXT,
        deadline TEXT,
        skills TEXT,
        status TEXT DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Create Milestones Table
      db.run(`CREATE TABLE IF NOT EXISTS milestones (
        id TEXT PRIMARY KEY,
        job_id TEXT,
        title TEXT,
        description TEXT,
        amount REAL,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY(job_id) REFERENCES jobs(id)
      )`);

      // Create Matches Table
      db.run(`CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        job_id TEXT,
        freelancer_id TEXT,
        freelancer_name TEXT,
        score REAL,
        reasoning TEXT,
        status TEXT DEFAULT 'matched',
        FOREIGN KEY(job_id) REFERENCES jobs(id)
      )`);

      // Create Chat Messages Table
      db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        job_id TEXT,
        sender_id TEXT,
        content TEXT,
        is_terms BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(job_id) REFERENCES jobs(id)
      )`);

      // Create Contracts Table (Escrow)
      db.run(`CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        job_id TEXT,
        employer_id TEXT,
        freelancer_id TEXT,
        escrow_status TEXT DEFAULT 'pending',
        agreed_amount REAL,
        FOREIGN KEY(job_id) REFERENCES jobs(id)
      )`);

      // Create Deliverables Table
      db.run(`CREATE TABLE IF NOT EXISTS deliverables (
        id TEXT PRIMARY KEY,
        milestone_id TEXT,
        freelancer_id TEXT,
        content TEXT,
        ai_verification_score REAL,
        ai_verification_report TEXT,
        status TEXT DEFAULT 'submitted',
        FOREIGN KEY(milestone_id) REFERENCES milestones(id)
      )`);
    });
  }
});

module.exports = db;
