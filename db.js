const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or open DB
const dbPath = path.resolve(__dirname, 'minbar.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database " + err.message);
  } else {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'imam',
        level TEXT DEFAULT 'مبتدئ'
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        sessions_count INTEGER DEFAULT 0,
        kpi_score INTEGER DEFAULT 0,
        achievements_data TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS khutbahs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`);

      // Seed local user if not exists
      db.run(`INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (1, 'المستخدم المحلي', 'local@minbar', 'none', 'imam')`);
      db.run(`INSERT OR IGNORE INTO progress (id, user_id) VALUES (1, 1)`);
      
      console.log("Database tables ready.");
    });
  }
});

module.exports = db;
