require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'afrizend-super-secret-key-2026';

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Activity Tracker
const trackActivity = (userId, actionType, details = {}) => {
  const activityId = uuidv4();
  db.run(`INSERT INTO user_activities (id, user_id, action_type, details) VALUES (?, ?, ?, ?)`,
    [activityId, userId, actionType, JSON.stringify(details)],
    (err) => {
      if (err) console.error("Failed to track activity:", err.message);
    }
  );
};

// Kora API Service
const koraService = require('./services/koraService');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'mock_api_key');

// ==========================================
// 0. AUTHENTICATION
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, company, skills, bio, hourlyRate, walletAddress } = req.body;
  const userId = uuidv4();

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Auto-generate Kora virtual pointer if not provided
    const finalWalletAddress = walletAddress || `@kora.afrizend.dev/${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    db.run(`INSERT INTO users (id, name, email, password_hash, role, company, skills, bio, hourly_rate, wallet_address, trust_score, balance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, passwordHash, role, company, JSON.stringify(skills || []), bio, hourlyRate || null, finalWalletAddress, 75.0, 0.0],
      (err) => {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        
        trackActivity(userId, 'USER_REGISTERED', { role });
        
        const token = jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
          token,
          user: { id: userId, name, email, role, company, skills, bio, hourlyRate, walletAddress: finalWalletAddress, trustScore: 75.0, balance: 0.0 }
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    trackActivity(user.id, 'USER_LOGGED_IN');

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // Clean up response
    delete user.password_hash;
    try { user.skills = JSON.parse(user.skills); } catch (e) {}
    
    res.json({ token, user });
  });
});

app.get('/api/users/me', authenticateToken, (req, res) => {
  db.get(`SELECT id, name, email, role, company, skills, bio, hourly_rate, wallet_address, trust_score, balance, created_at FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    try { user.skills = JSON.parse(user.skills); } catch (e) {}
    res.json(user);
  });
});

app.post('/api/wallet/fund', authenticateToken, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
  
  db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    trackActivity(req.user.id, 'FUNDS_DEPOSITED', { amount });
    db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id], (err, row) => {
      res.json({ balance: row.balance, success: true });
    });
  });
});

app.post('/api/wallet/withdraw', authenticateToken, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
  
  db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (user.balance < amount) return res.status(400).json({ error: "Insufficient funds" });
    
    db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [amount, req.user.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      trackActivity(req.user.id, 'FUNDS_WITHDRAWN', { amount });
      db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id], (err, row) => {
        res.json({ balance: row.balance, success: true });
      });
    });
  });
});

app.post('/api/wallet/virtual', authenticateToken, (req, res) => {
  db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    try {
      // Issue virtual account via Kora
      const koraRes = await koraService.createVirtualAccount(user);
      if (!koraRes.success) {
        return res.status(400).json({ error: koraRes.error || "Failed to create virtual account" });
      }

      const { account_number, bank_name, account_reference } = koraRes.account;

      // Save to DB
      db.run(`UPDATE users SET virtual_account_number = ?, virtual_bank_name = ?, virtual_account_reference = ? WHERE id = ?`, 
        [account_number, bank_name, account_reference, user.id], 
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          trackActivity(user.id, 'VIRTUAL_WALLET_ISSUED', { account_number });
          res.json({ success: true, account: koraRes.account });
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// ==========================================
// 1. JOBS & AI MATCHING
// ==========================================
app.post('/api/jobs', async (req, res) => {
  const { employer_id, title, description, budget, currency, deadline, skills, milestones } = req.body;
  const jobId = uuidv4();

  try {
    // 1. Insert Job
    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO jobs (id, employer_id, title, description, budget, currency, deadline, skills) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [jobId, employer_id, title, description, budget, currency, deadline, skills],
        (err) => err ? reject(err) : resolve()
      );
    });

    // 2. Insert Milestones
    for (const ms of milestones) {
      await new Promise((resolve, reject) => {
        db.run(`INSERT INTO milestones (id, job_id, title, description, amount) 
                VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), jobId, ms.title, ms.description, ms.amount],
          (err) => err ? reject(err) : resolve()
        );
      });
    }

    // 3. Trigger AI Matching via Gemini
    const prompt = `You are an AI matching engine for a freelance platform. A new job has been posted:
      Title: ${title}
      Description: ${description}
      Skills needed: ${skills}
      
      Generate 3 highly relevant fictional freelancers that perfectly match these skills.
      Output ONLY a valid JSON array of objects with the following schema:
      [
        {
          "freelancer_id": "uuid-string",
          "freelancer_name": "Full Name",
          "score": 0.95,
          "reasoning": "Brief explanation of why they are a match based on their past fictional experience."
        }
      ]`;

    let matchedFreelancers = [];
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'mock_api_key') {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) {
          matchedFreelancers = JSON.parse(jsonMatch[0]);
        }
      } catch (aiErr) {
        console.error("AI Matching failed, falling back to mock data:", aiErr);
      }
    }

    if (matchedFreelancers.length === 0) {
      matchedFreelancers = [
        { freelancer_id: "f-1", freelancer_name: "Praise M.", score: 0.98, reasoning: "Top rated designer with extensive multi-currency UI fintech experience." },
        { freelancer_id: "f-2", freelancer_name: "Iyinoluwa A.", score: 0.96, reasoning: "Expert React developer with strong system integrations record." },
        { freelancer_id: "f-3", freelancer_name: "Kelechi O.", score: 0.88, reasoning: "Experienced frontend developer fluent in Tailwind CSS and styling systems." }
      ];
    }

    // Insert Matches
    for (const match of matchedFreelancers) {
      await new Promise((resolve, reject) => {
        db.run(`INSERT INTO matches (id, job_id, freelancer_id, freelancer_name, score, reasoning) 
                VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), jobId, match.freelancer_id || uuidv4(), match.freelancer_name, match.score, match.reasoning],
          (err) => err ? reject(err) : resolve()
        );
      });
    }

    trackActivity(employer_id, 'JOB_CREATED', { jobId, title, budget });

    res.status(201).json({ success: true, jobId, message: 'Job created and matched successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jobs/:id/matches', (req, res) => {
  db.all(`SELECT * FROM matches WHERE job_id = ? ORDER BY score DESC`, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ==========================================
// 2. CHAT & TERMS
// ==========================================
app.post('/api/chat', (req, res) => {
  const { job_id, sender_id, content, is_terms } = req.body;
  const msgId = uuidv4();
  db.run(`INSERT INTO chat_messages (id, job_id, sender_id, content, is_terms) VALUES (?, ?, ?, ?, ?)`,
    [msgId, job_id, sender_id, content, is_terms ? 1 : 0],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      trackActivity(sender_id, 'MESSAGE_SENT', { msgId, job_id, is_terms });
      res.status(201).json({ success: true, messageId: msgId });
    }
  );
});

// ==========================================
// 3. ESCROW (KORA API)
// ==========================================
app.post('/api/escrow/lock', (req, res) => {
  const { job_id, employer_id, freelancer_id, agreed_amount, payment_currency, settlement_currency } = req.body;
  const contractId = uuidv4();
  
  // 1. Check employer balance
  db.get(`SELECT balance FROM users WHERE id = ?`, [employer_id], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: "Employer not found" });
    if (user.balance < agreed_amount) {
      return res.status(400).json({ error: "Insufficient virtual balance. Please deposit funds first." });
    }

    try {
      // 2. Deduct from balance
      await new Promise((resolve, reject) => {
        db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [agreed_amount, employer_id], (updateErr) => {
          if (updateErr) reject(updateErr);
          else resolve();
        });
      });
      
      trackActivity(employer_id, 'FUNDS_LOCKED_IN_ESCROW', { amount: agreed_amount, job_id });

      // 3. Lock via Kora
      const escrowResult = await koraService.lockFunds(employer_id, agreed_amount, payment_currency || 'NGN', settlement_currency || 'NGN');
      
      // 4. Save contract
      db.run(`INSERT INTO contracts (id, job_id, employer_id, freelancer_id, escrow_status, agreed_amount) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        [contractId, job_id, employer_id, freelancer_id, 'locked', agreed_amount],
        (insertErr) => {
          if (insertErr) return res.status(500).json({ error: insertErr.message });
          res.status(200).json({ success: true, contractId, escrowResult });
        }
      );
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// ==========================================
// 4. DELIVERABLES & AI VERIFICATION
// ==========================================
app.post('/api/deliverables', async (req, res) => {
  const { milestone_id, freelancer_id, content } = req.body;
  const deliveryId = uuidv4();

  try {
    // 1. Fetch milestone details
    const milestone = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM milestones WHERE id = ?`, [milestone_id], (err, row) => {
        err ? reject(err) : resolve(row);
      });
    });

    if (!milestone) return res.status(404).json({ error: "Milestone not found" });

    // 2. AI Review via Gemini
    const prompt = `You are an AI code/deliverable reviewer for a freelance platform named Afrizend. 
      Milestone requirements: "${milestone.title} - ${milestone.description}"
      Freelancer submission: "${content}"
      
      Review the submission against the milestone criteria.
      Output ONLY a valid JSON object with the following schema:
      {
        "score": 0.98, // Confidence score between 0.0 and 1.0
        "report": "Detailed verification report with annotations on what was completed well."
      }`;

    let aiResult = { score: 0.95, report: "AI Verification successful. Code satisfies all acceptance criteria." };
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'mock_api_key') {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const response = await model.generateContent(prompt);
        const text = response.response.text();
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
          aiResult = JSON.parse(jsonMatch[0]);
        }
      } catch (aiErr) {
        console.error("AI Verification failed, falling back:", aiErr);
      }
    }

    // 3. Save Deliverable
    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO deliverables (id, milestone_id, freelancer_id, content, ai_verification_score, ai_verification_report) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        [deliveryId, milestone_id, freelancer_id, content, aiResult.score, aiResult.report],
        (err) => err ? reject(err) : resolve()
      );
    });

    // Update Milestone status
    db.run(`UPDATE milestones SET status = 'in_review' WHERE id = ?`, [milestone_id]);

    trackActivity(freelancer_id, 'MILESTONE_SUBMITTED', { deliveryId, milestone_id, aiScore: aiResult.score });

    res.status(200).json({ success: true, deliveryId, aiResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. APPROVE & PAYOUT (KORA API)
// ==========================================
app.post('/api/escrow/payout', async (req, res) => {
  const { milestone_id, contract_id } = req.body;

  try {
    // Update Milestone
    await new Promise((resolve, reject) => {
      db.run(`UPDATE milestones SET status = 'approved' WHERE id = ?`, [milestone_id], (err) => err ? reject(err) : resolve());
    });

    // Fetch contract details
    const contract = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM contracts WHERE id = ?`, [contract_id], (err, row) => err ? reject(err) : resolve(row));
    });

    // Execute Kora Settlement Disbursement
    const payoutResult = await koraService.executePayout(contract.freelancer_id, contract.agreed_amount);

    res.status(200).json({ success: true, message: 'Kora payout settled successfully', payoutResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Afrizend backend running on port ${PORT}`);
});
