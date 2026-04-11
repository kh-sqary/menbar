require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { OpenAI } = require('openai');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';

// Setup OpenAI
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
const authenticate = (req, res, next) => {
  req.userId = 1; // Force local user ID 1
  next();
};

// ==========================================
// ROUTES: USER PROGRESS
// ==========================================
app.get('/api/user/progress', authenticate, (req, res) => {
  db.get(`
    SELECT p.*, u.name, u.email, u.role, u.level 
    FROM progress p 
    JOIN users u ON p.user_id = u.id 
    WHERE p.user_id = ?
  `, [req.userId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Progress not found' });
    res.json(row);
  });
});

app.post('/api/user/progress', authenticate, (req, res) => {
  const { sessions_count, kpi_score, achievements_data } = req.body;
  db.run(`
    UPDATE progress 
    SET sessions_count = COALESCE(?, sessions_count),
        kpi_score = COALESCE(?, kpi_score),
        achievements_data = COALESCE(?, achievements_data)
    WHERE user_id = ?
  `, [sessions_count, kpi_score, achievements_data ? JSON.stringify(achievements_data) : null, req.userId], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update progress' });

    // Optionally update user level if sessions/kpi is high enough
    if (sessions_count > 10) {
      db.run("UPDATE users SET level = 'متوسط' WHERE id = ?", [req.userId]);
    }

    res.json({ success: true });
  });
});

// ==========================================
// ROUTES: KHUTBAHS
// ==========================================
app.get('/api/khutbahs', authenticate, (req, res) => {
  db.all("SELECT * FROM khutbahs WHERE user_id = ? ORDER BY created_at DESC", [req.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch khutbahs' });
    res.json(rows || []);
  });
});

app.post('/api/khutbahs', authenticate, (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  db.run("INSERT INTO khutbahs (user_id, title, content) VALUES (?, ?, ?)", [req.userId, title, content], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to save khutbah' });
    res.json({ id: this.lastID, success: true });
  });
});

// ==========================================
// ROUTES: AI CHATBOT
// ==========================================
app.post('/api/chat', authenticate, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  if (!openai) {
    return res.json({ reply: 'هذا مجرد رد تجريبي نظراً لعدم توفر مفتاح OpenAI API. ' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // fallback to mini for speed
      messages: [
        {
          role: "system",
          content: "أنت مساعد ذكي لمنصة منبر لتدريب الدعاة. تصرف كخبير في الدعوة الإسلامية والعقيدة. أجب باللغة العربية بأسلوب حكيم ولطيف ومشجع، وساعد الطالب في الرد على الشبهات أو تعلم الخطابة."
        },
        { role: "user", content: message }
      ],
      max_tokens: 300,
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: 'فشل في الاتصال بالمساعد الذكي' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
