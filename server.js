const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();

// Bot configuration
const BOT_TOKEN = '7967948563:AAEcl-6mW5kd4jaqjsRIqnv34egBWmh1LiI';
const WEBHOOK_URL = 'https://agrobmin.com.ua/webhook';
const DOMAIN = 'agrobmin.com.ua';

// Simple file-based database
const DB_FILE = 'neonroll_db.json';

// Initialize database
let db = {
  users: {},
  games: [],
  referrals: {}
};

// Load database
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (error) {
    console.error('Error loading database:', error);
  }
}

// Save database
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Telegram Bot API functions
async function sendToTelegram(method, data) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Telegram API error:', error);
    return null;
  }
}

// Set webhook
async function setWebhook() {
  try {
    const result = await sendToTelegram('setWebhook', {
      url: WEBHOOK_URL,
      allowed_updates: ['message', 'callback_query', 'inline_query']
    });
    console.log('Webhook set:', result);
  } catch (error) {
    console.error('Error setting webhook:', error);
  }
}

// Validate Telegram WebApp data
function validateTelegramWebAppData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  
  return hash === computedHash;
}

// Initialize user in database
function initUser(userData) {
  if (!db.users[userData.id]) {
    db.users[userData.id] = {
      id: userData.id,
      first_name: userData.first_name || 'Player',
      last_name: userData.last_name || '',
      username: userData.username || '',
      balance: 1000, // Starting balance
      total_bets: 0,
      total_wins: 0,
      games_played: 0,
      tasks_completed: [],
      referral_code: generateReferralCode(),
      referred_by: null,
      referrals: {
        level1: [],
        level2: [],
        level3: []
      },
      created_at: new Date().toISOString()
    };
    saveDB();
  }
  return db.users[userData.id];
}

// Generate referral code
function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Routes

// Main Mini App route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const update = req.body;
  
  if (update.message) {
    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text;
    
    if (text === '/start') {
      const user = initUser(message.from);
      
      const keyboard = {
        inline_keyboard: [[
          {
            text: '🎮 Play Neon Roll',
            web_app: { url: `https://${DOMAIN}` }
          }
        ]]
      };
      
      sendToTelegram('sendMessage', {
        chat_id: chatId,
        text: `🌟 Welcome to Neon Roll! 🌟\n\nYour futuristic casino experience awaits!\n\n💰 Starting Balance: ${user.balance} AI\n🎯 Referral Code: ${user.referral_code}\n\nClick below to start playing!`,
        reply_markup: keyboard
      });
    }
  }
  
  res.status(200).send('OK');
});

// API Routes

// Get user data
app.post('/api/user', (req, res) => {
  try {
    const { initData } = req.body;
    
    if (!validateTelegramWebAppData(initData)) {
      return res.status(401).json({ error: 'Invalid init data' });
    }
    
    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user'));
    
    const userData = initUser(user);
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Place bet
app.post('/api/bet', (req, res) => {
  try {
    const { initData, betAmount, selectedColor } = req.body;
    
    if (!validateTelegramWebAppData(initData)) {
      return res.status(401).json({ error: 'Invalid init data' });
    }
    
    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user'));
    const userData = db.users[user.id];
    
    if (!userData || userData.balance < betAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Game logic
    const colors = ['red', 'blue', 'green', 'yellow'];
    const multipliers = {
      red: 2.2,
      blue: 2.2,
      green: 5,
      yellow: 45
    };
    
    const weights = {
      red: 40,
      blue: 40,
      green: 15,
      yellow: 5
    };
    
    // Generate random result based on weights
    const random = Math.random() * 100;
    let result;
    let cumulative = 0;
    
    for (const color of colors) {
      cumulative += weights[color];
      if (random <= cumulative) {
        result = color;
        break;
      }
    }
    
    const won = result === selectedColor;
    const multiplier = won ? multipliers[selectedColor] : 0;
    const winAmount = won ? Math.floor(betAmount * multiplier) : 0;
    
    // Update user balance
    userData.balance -= betAmount;
    if (won) {
      userData.balance += winAmount;
      userData.total_wins += winAmount;
    }
    userData.total_bets += betAmount;
    userData.games_played += 1;
    
    // Save game result
    const gameResult = {
      id: Date.now(),
      user_id: user.id,
      bet_amount: betAmount,
      selected_color: selectedColor,
      result_color: result,
      won: won,
      win_amount: winAmount,
      multiplier: multiplier,
      timestamp: new Date().toISOString()
    };
    
    db.games.unshift(gameResult);
    if (db.games.length > 1000) {
      db.games = db.games.slice(0, 1000);
    }
    
    // Process referral rewards
    if (userData.referred_by && db.users[userData.referred_by]) {
      const referrer = db.users[userData.referred_by];
      const commission = Math.floor(betAmount * 0.05); // 5% commission
      referrer.balance += commission;
    }
    
    saveDB();
    
    res.json({
      success: true,
      result: result,
      won: won,
      winAmount: winAmount,
      multiplier: multiplier,
      newBalance: userData.balance,
      gameId: gameResult.id
    });
  } catch (error) {
    console.error('Error placing bet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get game history
app.post('/api/history', (req, res) => {
  try {
    const { initData } = req.body;
    
    if (!validateTelegramWebAppData(initData)) {
      return res.status(401).json({ error: 'Invalid init data' });
    }
    
    const recentGames = db.games.slice(0, 50);
    res.json({ success: true, games: recentGames });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tasks
app.post('/api/tasks', (req, res) => {
  try {
    const { initData } = req.body;
    
    if (!validateTelegramWebAppData(initData)) {
      return res.status(401).json({ error: 'Invalid init data' });
    }
    
    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user'));
    const userData = db.users[user.id];
    
    const tasks = [
      {
        id: 'invite_3',
        type: 'referral',
        title: 'Invite 3 active friends!',
        reward: 21,
        target: 3,
        current: userData.referrals.level1.length,
        completed: userData.referrals.level1.length >= 3
      },
      {
        id: 'invite_7',
        type: 'referral',
        title: 'Invite 7 active friends!',
        reward: 28,
        target: 7,
        current: userData.referrals.level1.length,
        completed: userData.referrals.level1.length >= 7
      },
      {
        id: 'bet_500',
        type: 'betting',
        title: 'Place 500 Bets!',
        reward: 25,
        target: 500,
        current: userData.games_played,
        completed: userData.games_played >= 500
      },
      {
        id: 'bet_1000',
        type: 'betting',
        title: 'Place 1000 Bets!',
        reward: 50,
        target: 1000,
        current: userData.games_played,
        completed: userData.games_played >= 1000
      }
    ];
    
    res.json({ success: true, tasks: tasks });
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process referral
app.post('/api/referral', (req, res) => {
  try {
    const { initData, referralCode } = req.body;
    
    if (!validateTelegramWebAppData(initData)) {
      return res.status(401).json({ error: 'Invalid init data' });
    }
    
    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user'));
    const userData = db.users[user.id];
    
    // Find referrer
    const referrer = Object.values(db.users).find(u => u.referral_code === referralCode);
    
    if (!referrer || referrer.id === user.id) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }
    
    if (userData.referred_by) {
      return res.status(400).json({ error: 'Already referred by someone' });
    }
    
    // Set referral relationship
    userData.referred_by = referrer.id;
    referrer.referrals.level1.push(user.id);
    
    // Give referral bonus
    referrer.balance += 3; // 3 AI bonus for referral
    
    saveDB();
    
    res.json({ success: true, message: 'Referral processed successfully' });
  } catch (error) {
    console.error('Error processing referral:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// HTTPS server configuration
const options = {
  key: fs.readFileSync('sertificat.key'),
  cert: fs.readFileSync('sertificat.pem')
};

const PORT = process.env.PORT || 443;

https.createServer(options, app).listen(PORT, () => {
  console.log(`🚀 Neon Roll server running on https://${DOMAIN}:${PORT}`);
  
  // Set webhook on startup
  setTimeout(() => {
    setWebhook();
  }, 2000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  saveDB();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  saveDB();
  process.exit(0);
});