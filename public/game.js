// Neon Roll Game - Main JavaScript File

class NeonRollGame {
    constructor() {
        this.user = null;
        this.balance = 0;
        this.isGameRunning = false;
        this.selectedColor = null;
        this.betAmount = 5;
        this.timer = null;
        this.timerValue = 13.62;
        this.recentGames = [];
        this.players = [];
        this.tasks = [];
        this.sounds = {};
        
        // Initialize the app
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoading();
        
        // Initialize Telegram WebApp
        this.initTelegramWebApp();
        
        // Initialize sounds
        this.initSounds();
        
        // Load user data
        await this.loadUserData();
        
        // Initialize UI components
        this.initUI();
        
        // Start game timer
        this.startGameTimer();
        
        // Load initial data
        await this.loadGameData();
        
        // Hide loading screen
        setTimeout(() => {
            this.hideLoading();
        }, 2000);
    }

    initTelegramWebApp() {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            
            // Enable closing confirmation
            tg.enableClosingConfirmation();
            
            // Set header color
            tg.setHeaderColor('#0a0a0f');
            
            // Expand the app
            tg.expand();
            
            // Ready
            tg.ready();
            
            console.log('Telegram WebApp initialized');
        }
    }

    initSounds() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Generate sound effects using Web Audio API
            this.sounds = {
                spin: this.createSpinSound(),
                win: this.createWinSound(),
                lose: this.createLoseSound(),
                click: this.createClickSound(),
                notification: this.createNotificationSound()
            };
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            this.sounds = {};
        }
    }

    createSpinSound() {
        const duration = 0.5;
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const frequency = 200 + (t / duration) * 300;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 3) * 0.3;
        }
        
        return buffer;
    }

    createWinSound() {
        const duration = 1.0;
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const frequency = 440 + Math.sin(t * 10) * 100;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 2) * 0.3;
        }
        
        return buffer;
    }

    createLoseSound() {
        const duration = 0.8;
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const frequency = 220 - (t / duration) * 100;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 2) * 0.3;
        }
        
        return buffer;
    }

    createClickSound() {
        const duration = 0.1;
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / this.audioContext.sampleRate;
            data[i] = (Math.random() - 0.5) * Math.exp(-t * 50) * 0.3;
        }
        
        return buffer;
    }

    createNotificationSound() {
        const duration = 0.5;
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < buffer.length; i++) {
            const t = i / this.audioContext.sampleRate;
            const frequency = 800;
            data[i] = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-t * 4) * 0.2;
        }
        
        return buffer;
    }

    playSound(soundName) {
        if (!this.audioContext || !this.sounds[soundName]) return;
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.sounds[soundName];
            gainNode.gain.value = 0.3;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start();
        } catch (error) {
            console.warn('Sound playback failed:', error);
        }
    }

    showLoading() {
        document.getElementById('loading-screen').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-screen').classList.add('hidden');
    }

    async loadUserData() {
        try {
            const initData = window.Telegram?.WebApp?.initData || '';
            
            const response = await fetch('/api/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ initData })
            });

            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.balance = this.user.balance;
                this.updateUserInfo();
            } else {
                // Fallback for testing
                this.user = {
                    id: Date.now(),
                    first_name: 'Demo User',
                    balance: 1000
                };
                this.balance = this.user.balance;
                this.updateUserInfo();
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            // Fallback
            this.user = {
                id: Date.now(),
                first_name: 'Demo User',
                balance: 1000
            };
            this.balance = this.user.balance;
            this.updateUserInfo();
        }
    }

    updateUserInfo() {
        if (this.user) {
            document.getElementById('user-name').textContent = this.user.first_name || 'Player';
            document.getElementById('user-balance').textContent = `${this.balance.toFixed(2)} AI`;
        }
    }

    initUI() {
        // Navigation
        this.initNavigation();
        
        // Betting controls
        this.initBettingControls();
        
        // Multiplier buttons
        this.initMultiplierButtons();
        
        // Deposit/Withdraw
        this.initCryptoOptions();
        
        // Tasks
        this.initTasks();
        
        // Friends/Referral
        this.initReferral();
    }

    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                this.playSound('click');
                const section = item.getAttribute('data-section');
                this.switchSection(section);
                
                // Update active nav item
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    switchSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section, .game-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            
            // Load section-specific data
            this.loadSectionData(sectionName);
        }
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'tasks':
                await this.loadTasks();
                break;
            case 'friends':
                await this.loadReferralData();
                break;
            case 'game':
                await this.loadGameHistory();
                break;
        }
    }

    initBettingControls() {
        const betInput = document.getElementById('bet-amount');
        const betControls = document.querySelectorAll('.bet-control-btn');
        
        betControls.forEach(btn => {
            btn.addEventListener('click', () => {
                this.playSound('click');
                const action = btn.getAttribute('data-action');
                
                switch (action) {
                    case 'min':
                        this.betAmount = 1;
                        break;
                    case 'half':
                        this.betAmount = Math.max(1, Math.floor(this.betAmount / 2));
                        break;
                    case 'double':
                        this.betAmount = Math.min(this.balance, this.betAmount * 2);
                        break;
                    case 'max':
                        this.betAmount = this.balance;
                        break;
                }
                
                betInput.value = this.betAmount;
            });
        });
        
        betInput.addEventListener('input', (e) => {
            this.betAmount = Math.max(1, Math.min(this.balance, parseInt(e.target.value) || 1));
            e.target.value = this.betAmount;
        });
    }

    initMultiplierButtons() {
        const multiplierBtns = document.querySelectorAll('.multiplier-btn');
        
        multiplierBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.playSound('click');
                
                if (this.isGameRunning) return;
                
                const color = btn.getAttribute('data-color');
                this.selectedColor = color;
                
                // Update visual selection
                multiplierBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                // Place bet
                this.placeBet();
            });
        });
    }

    async placeBet() {
        if (!this.selectedColor || this.betAmount <= 0 || this.betAmount > this.balance || this.isGameRunning) {
            return;
        }
        
        this.isGameRunning = true;
        
        // Show game notification
        this.showGameNotification();
        
        // Play spin animation
        this.playSpinAnimation();
        
        // Play spin sound
        this.playSound('spin');
        
        try {
            const initData = window.Telegram?.WebApp?.initData || '';
            
            const response = await fetch('/api/bet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    initData,
                    betAmount: this.betAmount,
                    selectedColor: this.selectedColor
                })
            });

            if (response.ok) {
                const result = await response.json();
                await this.handleGameResult(result);
            } else {
                throw new Error('Bet placement failed');
            }
        } catch (error) {
            console.error('Bet error:', error);
            // Simulate result for demo
            await this.simulateGameResult();
        }
        
        this.isGameRunning = false;
    }

    async simulateGameResult() {
        const colors = ['red', 'blue', 'green', 'yellow'];
        const weights = { red: 40, blue: 40, green: 15, yellow: 5 };
        const multipliers = { red: 2.2, blue: 2.2, green: 5, yellow: 45 };
        
        // Generate weighted random result
        const random = Math.random() * 100;
        let cumulative = 0;
        let result = 'red';
        
        for (const color of colors) {
            cumulative += weights[color];
            if (random <= cumulative) {
                result = color;
                break;
            }
        }
        
        const won = result === this.selectedColor;
        const multiplier = won ? multipliers[this.selectedColor] : 0;
        const winAmount = won ? Math.floor(this.betAmount * multiplier) : 0;
        
        // Update balance
        this.balance -= this.betAmount;
        if (won) {
            this.balance += winAmount;
        }
        
        await this.handleGameResult({
            result: result,
            won: won,
            winAmount: winAmount,
            multiplier: multiplier,
            newBalance: this.balance
        });
    }

    async handleGameResult(result) {
        // Wait for spin animation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Hide game notification
        this.hideGameNotification();
        
        // Highlight winning color
        this.highlightWinningColor(result.result);
        
        // Update balance
        this.balance = result.newBalance;
        this.updateUserInfo();
        
        // Play appropriate sound
        if (result.won) {
            this.playSound('win');
            this.showWinEffect(result.winAmount, result.multiplier);
        } else {
            this.playSound('lose');
            this.showLoseEffect();
        }
        
        // Update recent games
        this.updateRecentGames(result.result);
        
        // Add to players list
        this.addPlayerToList(result);
        
        // Reset selection
        document.querySelectorAll('.multiplier-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.selectedColor = null;
        
        // Restart timer
        this.resetGameTimer();
    }

    showGameNotification() {
        const notification = document.getElementById('game-notification');
        notification.classList.remove('hidden');
        this.playSound('notification');
    }

    hideGameNotification() {
        const notification = document.getElementById('game-notification');
        notification.classList.add('hidden');
    }

    playSpinAnimation() {
        const colorBlocks = document.querySelectorAll('.color-block');
        
        colorBlocks.forEach((block, index) => {
            setTimeout(() => {
                block.classList.add('spinning');
                setTimeout(() => {
                    block.classList.remove('spinning');
                }, 500);
            }, index * 100);
        });
    }

    highlightWinningColor(winningColor) {
        const colorBlocks = document.querySelectorAll('.color-block');
        
        colorBlocks.forEach(block => {
            if (block.getAttribute('data-color') === winningColor) {
                block.classList.add('winner');
                setTimeout(() => {
                    block.classList.remove('winner');
                }, 3000);
            }
        });
    }

    showWinEffect(amount, multiplier) {
        // Create floating win text
        const winText = document.createElement('div');
        winText.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 2rem;
            font-weight: 900;
            color: #00ff80;
            text-shadow: 0 0 20px rgba(0, 255, 128, 0.8);
            z-index: 1001;
            pointer-events: none;
            font-family: 'Orbitron', monospace;
        `;
        winText.textContent = `+${amount} AI (x${multiplier})`;
        
        document.body.appendChild(winText);
        
        // Animate
        winText.animate([
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1.2)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
            { opacity: 0, transform: 'translate(-50%, -150%) scale(1)' }
        ], {
            duration: 3000,
            easing: 'ease-out'
        }).onfinish = () => {
            document.body.removeChild(winText);
        };
        
        // Screen flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(0, 255, 128, 0.3), transparent);
            z-index: 999;
            pointer-events: none;
        `;
        
        document.body.appendChild(flash);
        
        flash.animate([
            { opacity: 0 },
            { opacity: 1 },
            { opacity: 0 }
        ], {
            duration: 500,
            easing: 'ease-out'
        }).onfinish = () => {
            document.body.removeChild(flash);
        };
    }

    showLoseEffect() {
        // Create floating lose text
        const loseText = document.createElement('div');
        loseText.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 1.5rem;
            font-weight: 700;
            color: #ff4040;
            text-shadow: 0 0 15px rgba(255, 64, 64, 0.8);
            z-index: 1001;
            pointer-events: none;
            font-family: 'Orbitron', monospace;
        `;
        loseText.textContent = `-${this.betAmount} AI`;
        
        document.body.appendChild(loseText);
        
        // Animate
        loseText.animate([
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1.1)' },
            { opacity: 0, transform: 'translate(-50%, -150%) scale(1)' }
        ], {
            duration: 2000,
            easing: 'ease-out'
        }).onfinish = () => {
            document.body.removeChild(loseText);
        };
    }

    updateRecentGames(result) {
        this.recentGames.unshift(result);
        if (this.recentGames.length > 5) {
            this.recentGames = this.recentGames.slice(0, 5);
        }
        
        const indicators = document.getElementById('recent-games-indicators');
        indicators.innerHTML = '';
        
        this.recentGames.forEach(game => {
            const indicator = document.createElement('div');
            indicator.className = `indicator ${game}`;
            indicators.appendChild(indicator);
        });
    }

    addPlayerToList(result) {
        const player = {
            name: this.user.first_name || 'Player',
            bet: this.betAmount,
            multiplier: result.multiplier,
            won: result.won
        };
        
        this.players.unshift(player);
        if (this.players.length > 10) {
            this.players = this.players.slice(0, 10);
        }
        
        this.updatePlayersList();
    }

    updatePlayersList() {
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '';
        
        this.players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            
            let multiplierClass = 'lose';
            if (player.won) {
                if (player.multiplier >= 10) multiplierClass = 'high';
                else if (player.multiplier >= 3) multiplierClass = 'medium';
                else multiplierClass = 'win';
            }
            
            playerItem.innerHTML = `
                <div class="player-avatar">
                    <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2NjY2NjYiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDEyQzE0LjIwOTEgMTIgMTYgMTAuMjA5MSAxNiA4QzE2IDUuNzkwODYgMTQuMjA5MSA0IDEyIDRDOS43OTA4NiA0IDggNS43OTA4NiA4IDhDOCAxMC4yMDkxIDkuNzkwODYgMTIgMTIgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIgMTRDOC42ODYyOSAxNCA2IDE2LjY4NjMgNiAyMFYyMkMxOCAyMiAxOCAyMiAxOCAyMFYyMEMxOCAxNi42ODYzIDE1LjMxMzcgMTQgMTIgMTRaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+" alt="Player">
                </div>
                <div class="player-details">
                    <div class="player-name">${player.name}</div>
                    <div class="player-bet">${player.bet} AI</div>
                </div>
                <div class="player-multiplier ${multiplierClass}">
                    ${player.won ? `x${player.multiplier}` : `x${player.multiplier.toFixed(1)}`}
                </div>
            `;
            
            playersList.appendChild(playerItem);
        });
    }

    startGameTimer() {
        this.timer = setInterval(() => {
            this.timerValue -= 0.01;
            if (this.timerValue <= 0) {
                this.resetGameTimer();
            }
            document.getElementById('timer-value').textContent = this.timerValue.toFixed(2);
        }, 10);
    }

    resetGameTimer() {
        this.timerValue = 10 + Math.random() * 10; // 10-20 seconds
        document.getElementById('timer-value').textContent = this.timerValue.toFixed(2);
    }

    initCryptoOptions() {
        const cryptoOptions = document.querySelectorAll('.crypto-option');
        const depositDetails = document.getElementById('deposit-details');
        const backButton = document.querySelector('.back-button');
        
        cryptoOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.playSound('click');
                const crypto = option.getAttribute('data-crypto');
                this.showDepositDetails(crypto);
            });
        });
        
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.playSound('click');
                this.hideDepositDetails();
            });
        }
        
        // Copy wallet button
        const copyBtn = document.querySelector('.copy-wallet-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.playSound('click');
                const walletAddress = document.getElementById('wallet-address-text').textContent;
                
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(walletAddress);
                } else {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = walletAddress;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                }
                
                // Visual feedback
                copyBtn.textContent = '✅ Copied! ✅';
                setTimeout(() => {
                    copyBtn.textContent = '✅ Wallet copied ✅';
                }, 2000);
            });
        }
    }

    showDepositDetails(crypto) {
        const cryptoGrid = document.querySelector('#deposit-section .crypto-grid');
        const depositDetails = document.getElementById('deposit-details');
        
        cryptoGrid.style.display = 'none';
        depositDetails.classList.remove('hidden');
        
        // Update crypto info
        document.getElementById('selected-crypto').textContent = crypto.toUpperCase();
        
        // Generate wallet address (demo)
        const walletAddress = this.generateWalletAddress(crypto);
        document.getElementById('wallet-address-text').textContent = walletAddress;
        
        // Update exchange rate
        const rates = {
            'ton': '1 TON = 316.06 AI',
            'usdt': '1 USDT = 100 AI',
            'trx': '1 TRX = 12.5 AI',
            'bnb': '1 BNB = 45000 AI',
            'btc': '1 BTC = 8500000 AI',
            'doge': '1 DOGE = 8.2 AI',
            'ltc': '1 LTC = 7500 AI',
            'usdc': '1 USDC = 100 AI'
        };
        
        document.getElementById('exchange-rate').textContent = rates[crypto] || '1 = 100 AI';
    }

    hideDepositDetails() {
        const cryptoGrid = document.querySelector('#deposit-section .crypto-grid');
        const depositDetails = document.getElementById('deposit-details');
        
        cryptoGrid.style.display = 'grid';
        depositDetails.classList.add('hidden');
    }

    generateWalletAddress(crypto) {
        // Generate demo wallet addresses
        const addresses = {
            'ton': 'UQAYxMEw3LEdoV6fQ0xYf962boGFqlNnbAUCLL7zq6ks',
            'usdt': 'TQn9Y2khEsLMjSGM3kGd8Tr2X34k5BtP9K',
            'trx': 'TQn9Y2khEsLMjSGM3kGd8Tr2X34k5BtP9K',
            'bnb': '0x742d35cc6665C6686068Ea7D4E16f4e1e92f09e1',
            'btc': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            'doge': 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L',
            'ltc': 'LhK2gv9bAk6UBuqrNH7VJLgB7ykHJVzJ5R',
            'usdc': '0x742d35cc6665C6686068Ea7D4E16f4e1e92f09e1'
        };
        
        return addresses[crypto] || addresses.ton;
    }

    async loadTasks() {
        try {
            const initData = window.Telegram?.WebApp?.initData || '';
            
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ initData })
            });

            if (response.ok) {
                const data = await response.json();
                this.tasks = data.tasks;
            } else {
                this.tasks = this.generateDemoTasks();
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.tasks = this.generateDemoTasks();
        }
        
        this.updateTasksUI();
    }

    generateDemoTasks() {
        return [
            {
                id: 'invite_3',
                type: 'referral',
                title: 'Invite 3 active friends!',
                reward: 21,
                target: 3,
                current: 0,
                completed: false
            },
            {
                id: 'invite_7',
                type: 'referral',
                title: 'Invite 7 active friends!',
                reward: 28,
                target: 7,
                current: 0,
                completed: false
            },
            {
                id: 'bet_500',
                type: 'betting',
                title: 'Place 500 Bets!',
                reward: 25,
                target: 500,
                current: this.user?.games_played || 0,
                completed: false
            },
            {
                id: 'bet_1000',
                type: 'betting',
                title: 'Place 1000 Bets!',
                reward: 50,
                target: 1000,
                current: this.user?.games_played || 0,
                completed: false
            }
        ];
    }

    updateTasksUI() {
        const friendTasks = document.getElementById('friend-tasks');
        const bettingTasks = document.getElementById('betting-tasks');
        
        friendTasks.innerHTML = '';
        bettingTasks.innerHTML = '';
        
        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            
            if (task.type === 'referral') {
                friendTasks.appendChild(taskElement);
            } else if (task.type === 'betting') {
                bettingTasks.appendChild(taskElement);
            }
        });
    }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        
        const progressText = task.completed ? 'Completed' : `${task.current} / ${task.target}`;
        const progressClass = task.completed ? 'completed' : '';
        
        taskDiv.innerHTML = `
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                <div class="task-reward">⚡ ${task.reward} AI</div>
            </div>
            <div class="task-progress ${progressClass}">${progressText}</div>
        `;
        
        return taskDiv;
    }

    initTasks() {
        // Tasks are loaded dynamically when section is opened
    }

    initReferral() {
        const inviteBtn = document.getElementById('invite-friends-btn');
        
        if (inviteBtn) {
            inviteBtn.addEventListener('click', () => {
                this.playSound('click');
                this.shareReferralLink();
            });
        }
    }

    shareReferralLink() {
        const referralCode = this.user?.referral_code || 'DEMO123';
        const shareText = `🌟 Join me in Neon Roll - the most exciting crypto casino game! 🌟\n\n💰 Get free AI tokens to start playing\n🎯 Win up to x45 multipliers\n🚀 Futuristic neon gaming experience\n\nUse my referral code: ${referralCode}`;
        const shareUrl = `https://agrobmin.com.ua?ref=${referralCode}`;
        
        if (window.Telegram?.WebApp) {
            // Use Telegram sharing
            window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
        } else {
            // Fallback
            if (navigator.share) {
                navigator.share({
                    title: 'Neon Roll - Casino Game',
                    text: shareText,
                    url: shareUrl
                });
            } else {
                // Copy to clipboard
                navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
                alert('Referral link copied to clipboard!');
            }
        }
    }

    async loadReferralData() {
        // Update referral stats
        if (this.user) {
            const level1Count = this.user.referrals?.level1?.length || 0;
            const level2Count = this.user.referrals?.level2?.length || 0;
            const level3Count = this.user.referrals?.level3?.length || 0;
            
            // Update level stats
            const levelStats = document.querySelectorAll('.level-stat .level-count');
            if (levelStats[0]) levelStats[0].textContent = `${level1Count} people.`;
            if (levelStats[1]) levelStats[1].textContent = `${level2Count} people.`;
            if (levelStats[2]) levelStats[2].textContent = `${level3Count} people.`;
            
            // Update referrals list
            const noReferrals = document.querySelector('.no-referrals');
            if (level1Count === 0 && noReferrals) {
                noReferrals.textContent = 'You have no 1-level referrals';
            }
        }
    }

    async loadGameHistory() {
        try {
            const initData = window.Telegram?.WebApp?.initData || '';
            
            const response = await fetch('/api/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ initData })
            });

            if (response.ok) {
                const data = await response.json();
                this.updateGameHistory(data.games);
            }
        } catch (error) {
            console.error('Failed to load game history:', error);
        }
    }

    updateGameHistory(games) {
        // Update recent games indicators
        const recentGames = games.slice(0, 5).map(game => game.result_color);
        this.recentGames = recentGames;
        
        const indicators = document.getElementById('recent-games-indicators');
        indicators.innerHTML = '';
        
        recentGames.forEach(color => {
            const indicator = document.createElement('div');
            indicator.className = `indicator ${color}`;
            indicators.appendChild(indicator);
        });
        
        // Update players list with recent games
        const recentPlayers = games.slice(0, 10).map(game => ({
            name: `Player ${game.user_id.toString().slice(-4)}`,
            bet: game.bet_amount,
            multiplier: game.multiplier || 0,
            won: game.won
        }));
        
        this.players = recentPlayers;
        this.updatePlayersList();
    }

    async loadGameData() {
        await this.loadGameHistory();
        await this.loadTasks();
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.neonRollGame = new NeonRollGame();
});

// Handle visibility change to pause/resume game
document.addEventListener('visibilitychange', () => {
    if (window.neonRollGame) {
        if (document.hidden) {
            // Pause timers when tab is hidden
            if (window.neonRollGame.timer) {
                clearInterval(window.neonRollGame.timer);
            }
        } else {
            // Resume timers when tab is visible
            window.neonRollGame.startGameTimer();
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.neonRollGame?.timer) {
        clearInterval(window.neonRollGame.timer);
    }
});

// Prevent zooming on mobile
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Disable context menu
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// Disable text selection on mobile
document.addEventListener('selectstart', (e) => {
    e.preventDefault();
});

// Handle orientation change
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});

// Service Worker for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}