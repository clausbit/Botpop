# 🌟 Neon Roll - Telegram Mini App Casino Game 🎰

A stunning, futuristic casino game built as a Telegram Mini App with neon aesthetics, real-time gameplay, and cryptocurrency integration.

![Neon Roll](https://img.shields.io/badge/Version-1.0.0-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18+-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎮 Game Features
- **4-Color Roll Game**: Red, Blue, Green, Yellow with different multipliers
- **Real-time Gameplay**: Live timer countdown (10-20 second rounds)
- **Multiple Multipliers**: Win x2.2, x5, or x45 based on color selection
- **Live Player Feed**: See other players' bets and wins in real-time
- **Game History**: Track last 5 game results with color indicators

### 💎 Visual & UX
- **Neon Design**: Stunning cyberpunk aesthetics with glowing effects
- **Smooth Animations**: 60fps animations with CSS transforms and keyframes
- **Sound Effects**: Web Audio API generated sounds for spins, wins, and clicks
- **Responsive Design**: Optimized for mobile devices and Telegram WebView
- **PWA Support**: Service Worker for offline capabilities

### 💰 Financial System
- **Virtual Currency**: AI token system with starting balance
- **Deposit System**: Support for multiple cryptocurrencies (TON, USDT, TRX, BNB, Bitcoin, etc.)
- **Withdrawal Options**: Multiple crypto withdrawal methods with minimum amounts
- **Balance Management**: Real-time balance updates and transaction tracking

### 👥 Social Features
- **Referral Program**: 3-level referral system with commissions (5%, 1%, 1%)
- **Friend Invitations**: Share referral links through Telegram
- **Task System**: Earn rewards for inviting friends and placing bets
- **Leaderboards**: Player statistics and achievements

### 🔧 Technical Features
- **Telegram Integration**: Full WebApp API integration with user data
- **File-based Database**: Simple JSON database for easy deployment
- **HTTPS Support**: SSL certificate integration for secure connections
- **Webhook Support**: Telegram bot webhook for user interactions
- **PM2 Process Management**: Production-ready process management

## 🚀 Quick Start

### Prerequisites
- Ubuntu/Debian server with root access
- SSL certificates (`sertificat.pem` and `sertificat.key`)
- Domain pointed to your server (agrobmin.com.ua)
- Telegram Bot Token

### Installation

1. **Clone or upload the project files to your server**
2. **Ensure SSL certificates are in the project root**
3. **Run the deployment script**:

```bash
sudo ./start.sh
```

The script will automatically:
- Install Node.js and dependencies
- Configure firewall and security
- Set up PM2 process manager
- Start the HTTPS server
- Configure webhooks
- Display deployment information

## 📁 Project Structure

```
neon-roll/
├── server.js                 # Main Express.js server
├── package.json              # Node.js dependencies
├── start.sh                  # Deployment script
├── ecosystem.config.js       # PM2 configuration (auto-generated)
├── neonroll_db.json         # File-based database (auto-generated)
├── public/
│   ├── index.html           # Main HTML file
│   ├── styles.css           # Neon CSS styling
│   ├── game.js              # Game logic and UI
│   └── sw.js                # Service Worker (auto-generated)
├── logs/                    # PM2 logs (auto-generated)
└── README.md               # This file
```

## 🎯 Game Logic

### Color Probabilities
- **Red**: 40% chance - x2.2 multiplier
- **Blue**: 40% chance - x2.2 multiplier  
- **Green**: 15% chance - x5 multiplier
- **Yellow**: 5% chance - x45 multiplier

### Betting System
- **Minimum Bet**: 1 AI
- **Maximum Bet**: User's current balance
- **Bet Controls**: Min, 1/2, x2, Max buttons
- **Auto-deduction**: Bet amount is deducted before spin

### Referral Commissions
- **Level 1**: 5% of referral's bets
- **Level 2**: 1% of sub-referral's bets
- **Level 3**: 1% of sub-sub-referral's bets
- **Signup Bonus**: 3 AI for each active referral

## 🔐 Security Features

- **Telegram WebApp Validation**: Validates all requests using Telegram's signature
- **HTTPS Only**: All communications encrypted with SSL
- **Input Validation**: Server-side validation of all user inputs
- **Rate Limiting**: Prevention of spam and abuse
- **Firewall Configuration**: UFW configured for necessary ports only

## 📱 Telegram Bot Setup

1. **Create a bot with @BotFather**
2. **Set the bot description and commands**
3. **Configure the Menu Button**:
   ```
   /setmenubutton
   @YourBotUsername
   🎮 Play Neon Roll
   https://agrobmin.com.ua
   ```

4. **Set bot commands**:
   ```
   /start - Start playing Neon Roll
   ```

## 🔧 API Endpoints

### Public Endpoints
- `GET /` - Main Mini App interface
- `POST /webhook` - Telegram webhook

### API Endpoints (Requires Telegram Auth)
- `POST /api/user` - Get user data and initialize account
- `POST /api/bet` - Place a bet and get result
- `POST /api/history` - Get game history
- `POST /api/tasks` - Get user tasks and progress
- `POST /api/referral` - Process referral relationships

## 🎨 Customization

### Color Scheme
The neon theme uses these primary colors:
- **Cyan**: `#00ffff` - Primary accent
- **Magenta**: `#ff00ff` - Secondary accent  
- **Yellow**: `#ffff00` - Highlights
- **Green**: `#00ff80` - Success states
- **Red**: `#ff4040` - Error states

### Modifying Game Logic
Edit `server.js` to change:
- Color probabilities (weights object)
- Multiplier values (multipliers object)
- Starting balance and rewards
- Referral commission rates

### Styling Changes
Edit `public/styles.css` to modify:
- Color schemes and gradients
- Animation timings and effects
- Layout and responsive breakpoints
- Neon glow intensities

## 🔄 Management Commands

```bash
# View real-time logs
pm2 logs neon-roll

# Restart the application
pm2 restart neon-roll

# Stop the application
pm2 stop neon-roll

# Monitor performance
pm2 monit

# Check application status
pm2 status

# Backup database
cp neonroll_db.json neonroll_db.backup.json

# View error logs only
pm2 logs neon-roll --err

# Clear logs
pm2 flush neon-roll
```

## 📊 Database Structure

The file-based database (`neonroll_db.json`) stores:

```json
{
  "users": {
    "user_id": {
      "id": "telegram_user_id",
      "first_name": "User Name",
      "balance": 1000,
      "total_bets": 0,
      "total_wins": 0,
      "games_played": 0,
      "referral_code": "ABC123",
      "referred_by": "referrer_id",
      "referrals": {
        "level1": [],
        "level2": [],
        "level3": []
      }
    }
  },
  "games": [
    {
      "id": "timestamp",
      "user_id": "user_id",
      "bet_amount": 50,
      "selected_color": "red",
      "result_color": "blue",
      "won": false,
      "win_amount": 0,
      "multiplier": 0,
      "timestamp": "ISO_string"
    }
  ]
}
```

## 🐛 Troubleshooting

### Server Won't Start
1. Check SSL certificates are valid and in correct location
2. Verify port 443 is not in use: `netstat -tuln | grep :443`
3. Check PM2 logs: `pm2 logs neon-roll`
4. Ensure proper file permissions: `chmod 600 sertificat.key`

### Telegram Integration Issues
1. Verify bot token is correct
2. Check webhook URL is accessible: `curl https://agrobmin.com.ua/webhook`
3. Validate domain SSL certificate
4. Test bot commands in Telegram

### Performance Issues
1. Monitor resources: `pm2 monit`
2. Check disk space: `df -h`
3. View memory usage: `free -h`
4. Restart application: `pm2 restart neon-roll`

## 📈 Scaling and Production

### For Higher Traffic
1. **Enable PM2 Cluster Mode**:
   ```javascript
   // In ecosystem.config.js
   instances: 'max',
   exec_mode: 'cluster'
   ```

2. **Add Redis for Session Storage**:
   - Install Redis server
   - Modify server.js to use Redis for user sessions

3. **Database Migration**:
   - Consider PostgreSQL or MongoDB for larger datasets
   - Implement proper database indexing

4. **CDN Integration**:
   - Serve static assets through CDN
   - Enable Cloudflare for global performance

### Security Enhancements
1. **Rate Limiting**: Implement per-user request limits
2. **DDoS Protection**: Use Cloudflare or similar service
3. **Database Backups**: Automated daily backups
4. **Monitoring**: Set up application monitoring (e.g., New Relic)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review PM2 logs for error details

## 🔮 Future Enhancements

- [ ] Multiple game modes
- [ ] Tournament system
- [ ] Advanced statistics dashboard
- [ ] Mobile app version
- [ ] Multiple language support
- [ ] Social sharing features
- [ ] Advanced admin panel
- [ ] Cryptocurrency price integration
- [ ] Automated withdrawals
- [ ] VIP system with special rewards

---

**🎰 Ready to launch your Neon Roll casino? Run `sudo ./start.sh` and watch the magic happen! 🌟**