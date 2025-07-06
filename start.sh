#!/bin/bash

# Neon Roll Telegram Mini App - Start Script
# This script sets up and starts the Neon Roll casino game server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

print_header() {
    echo
    print_color $PURPLE "=================================="
    print_color $PURPLE "🌟 NEON ROLL CASINO GAME 🌟"
    print_color $PURPLE "Telegram Mini App Deployment"
    print_color $PURPLE "=================================="
    echo
}

print_step() {
    print_color $BLUE "⚡ $1"
}

print_success() {
    print_color $GREEN "✅ $1"
}

print_warning() {
    print_color $YELLOW "⚠️ $1"
}

print_error() {
    print_color $RED "❌ $1"
}

# Configuration
DOMAIN="agrobmin.com.ua"
BOT_TOKEN="7967948563:AAEcl-6mW5kd4jaqjsRIqnv34egBWmh1LiI"
PORT="443"
HTTP_PORT="80"
APP_DIR="/root/neon-roll"
SSL_CERT_PATH="./sertificat.pem"
SSL_KEY_PATH="./sertificat.key"

# Display header
print_header

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_step "Starting Neon Roll deployment..."

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check SSL certificates
print_step "Checking SSL certificates..."
if [[ ! -f "$SSL_CERT_PATH" ]] || [[ ! -f "$SSL_KEY_PATH" ]]; then
    print_error "SSL certificates not found!"
    print_error "Please ensure sertificat.pem and sertificat.key are in the project root."
    exit 1
fi
print_success "SSL certificates found"

# Check Node.js installation
print_step "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found. Installing Node.js..."
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    print_success "Node.js installed successfully"
else
    NODE_VERSION=$(node --version)
    print_success "Node.js is already installed: $NODE_VERSION"
fi

# Check npm installation
if ! command -v npm &> /dev/null; then
    print_error "npm not found. Please install npm manually."
    exit 1
fi

# Update system packages
print_step "Updating system packages..."
apt-get update -y
apt-get upgrade -y
print_success "System packages updated"

# Install additional system dependencies
print_step "Installing system dependencies..."
apt-get install -y curl wget git ufw fail2ban htop nano
print_success "System dependencies installed"

# Configure firewall
print_step "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
print_success "Firewall configured"

# Install PM2 globally for process management
print_step "Installing PM2 process manager..."
npm install -g pm2
print_success "PM2 installed"

# Install project dependencies
print_step "Installing project dependencies..."
npm install
print_success "Dependencies installed"

# Create logs directory
print_step "Creating logs directory..."
mkdir -p logs
print_success "Logs directory created"

# Stop any existing PM2 processes
print_step "Stopping existing processes..."
pm2 delete neon-roll 2>/dev/null || true
pm2 kill 2>/dev/null || true
print_success "Existing processes stopped"

# Create PM2 ecosystem file
print_step "Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'neon-roll',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: $PORT,
        DOMAIN: '$DOMAIN',
        BOT_TOKEN: '$BOT_TOKEN'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    }
  ]
};
EOF
print_success "PM2 configuration created"

# Create Service Worker for PWA
print_step "Creating Service Worker..."
cat > public/sw.js << 'EOF'
const CACHE_NAME = 'neon-roll-v1.0.0';
const urlsToCache = [
  '/',
  '/styles.css',
  '/game.js',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
EOF
print_success "Service Worker created"

# Create nginx configuration for reverse proxy (optional)
if command -v nginx &> /dev/null; then
    print_step "Creating nginx configuration..."
    cat > /etc/nginx/sites-available/neon-roll << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/neon-roll /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    print_success "Nginx configuration created"
fi

# Validate server configuration
print_step "Validating server configuration..."
if [[ ! -f "server.js" ]]; then
    print_error "server.js not found!"
    exit 1
fi

# Test SSL certificates
openssl x509 -in "$SSL_CERT_PATH" -text -noout > /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    print_error "Invalid SSL certificate!"
    exit 1
fi

openssl rsa -in "$SSL_KEY_PATH" -check -noout > /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    print_error "Invalid SSL private key!"
    exit 1
fi

print_success "SSL certificates validated"

# Set correct permissions
print_step "Setting file permissions..."
chmod 600 "$SSL_KEY_PATH"
chmod 644 "$SSL_CERT_PATH"
chmod +x start.sh
chown -R root:root .
print_success "File permissions set"

# Create database directory if it doesn't exist
print_step "Initializing database..."
touch neonroll_db.json
chmod 644 neonroll_db.json
print_success "Database initialized"

# Start the application with PM2
print_step "Starting Neon Roll server..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup
print_success "Server started with PM2"

# Wait a moment for the server to start
sleep 3

# Check if the server is running
if pm2 list | grep -q "neon-roll.*online"; then
    print_success "Neon Roll server is running successfully!"
else
    print_error "Failed to start Neon Roll server. Check logs:"
    pm2 logs neon-roll --lines 20
    exit 1
fi

# Display server information
echo
print_color $PURPLE "🎮 NEON ROLL DEPLOYMENT COMPLETE! 🎮"
echo
print_color $GREEN "Server Information:"
print_color $BLUE "• Domain: https://$DOMAIN"
print_color $BLUE "• Port: $PORT (HTTPS)"
print_color $BLUE "• HTTP Redirect: $HTTP_PORT → $PORT"
print_color $BLUE "• Process Manager: PM2"
print_color $BLUE "• Database: File-based (neonroll_db.json)"
echo
print_color $GREEN "Bot Configuration:"
print_color $BLUE "• Bot Token: ${BOT_TOKEN:0:20}..."
print_color $BLUE "• Webhook: https://$DOMAIN/webhook"
print_color $BLUE "• Mini App URL: https://$DOMAIN"
echo
print_color $GREEN "Useful Commands:"
print_color $BLUE "• View logs: pm2 logs neon-roll"
print_color $BLUE "• Restart server: pm2 restart neon-roll"
print_color $BLUE "• Stop server: pm2 stop neon-roll"
print_color $BLUE "• Monitor: pm2 monit"
print_color $BLUE "• Database backup: cp neonroll_db.json neonroll_db.backup.json"
echo
print_color $YELLOW "Next Steps:"
print_color $BLUE "1. Set up your Telegram bot with @BotFather"
print_color $BLUE "2. Configure the bot's menu button to open https://$DOMAIN"
print_color $BLUE "3. Test the Mini App in Telegram"
print_color $BLUE "4. Monitor server performance with 'pm2 monit'"
echo
print_color $GREEN "🚀 Your Neon Roll casino is now live!"
print_color $GREEN "Players can access it through your Telegram bot!"
echo

# Test webhook setup
print_step "Testing webhook setup..."
sleep 2
WEBHOOK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")
if [[ "$WEBHOOK_RESPONSE" == "200" ]]; then
    print_success "Webhook API accessible"
else
    print_warning "Could not verify webhook status (check bot token)"
fi

# Final checks
print_step "Running final system checks..."

# Check if port 443 is accessible
if netstat -tuln | grep -q ":443 "; then
    print_success "Port 443 is listening"
else
    print_warning "Port 443 might not be accessible"
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [[ $DISK_USAGE -gt 80 ]]; then
    print_warning "Disk usage is high: ${DISK_USAGE}%"
else
    print_success "Disk usage: ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
print_success "Memory usage: ${MEMORY_USAGE}%"

echo
print_color $PURPLE "========================================="
print_color $PURPLE "🎰 NEON ROLL IS READY TO PLAY! 🎰"
print_color $PURPLE "========================================="
echo

# Keep the script running to show real-time logs
print_color $YELLOW "Showing real-time logs (Press Ctrl+C to exit):"
echo
pm2 logs neon-roll --lines 0