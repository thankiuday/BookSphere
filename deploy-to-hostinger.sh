#!/bin/bash

# BookSphere Deployment Script for Hostinger VPS
# Run this script as root on your VPS

set -e  # Exit on any error

echo "🚀 Starting BookSphere deployment on Hostinger VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="booksphere.nerdsandgeeks.in"
APP_DIR="/var/www/booksphere"
REPO_URL="YOUR_GITHUB_REPO_URL_HERE"  # Replace with your actual repo URL

echo -e "${GREEN}Domain:${NC} $DOMAIN"
echo -e "${GREEN}App Directory:${NC} $APP_DIR"
echo -e "${GREEN}Repository:${NC} $REPO_URL"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y curl wget git nano ufw fail2ban

# Install Node.js 18.x
print_status "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js version: $NODE_VERSION"
print_status "NPM version: $NPM_VERSION"

# Install PM2 globally
print_status "Installing PM2 process manager..."
npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
apt install -y nginx

# Install Certbot for SSL
print_status "Installing Certbot for SSL certificates..."
apt install -y certbot python3-certbot-nginx

# Create application directory
print_status "Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository
print_status "Cloning repository..."
if [ -d ".git" ]; then
    print_warning "Repository already exists, pulling latest changes..."
    git pull origin main
else
    git clone $REPO_URL .
fi

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install --production
cd ..

# Install frontend dependencies and build
print_status "Installing frontend dependencies..."
cd frontend
npm install
print_status "Building frontend..."
npm run build
cd ..

# Create logs directory
mkdir -p logs

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'booksphere-backend',
    script: './backend/server.js',
    cwd: '/var/www/booksphere',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create Nginx configuration
print_status "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/booksphere << 'EOF'
server {
    listen 80;
    server_name booksphere.nerdsandgeeks.in www.booksphere.nerdsandgeeks.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name booksphere.nerdsandgeeks.in www.booksphere.nerdsandgeeks.in;
    
    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/booksphere.nerdsandgeeks.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/booksphere.nerdsandgeeks.in/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Frontend (Static Files)
    location / {
        root /var/www/booksphere/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary Accept-Encoding;
        }
        
        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob: https:; font-src 'self' data: https:;" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }
}
EOF

# Enable the site
print_status "Enabling Nginx site..."
ln -sf /etc/nginx/sites-available/booksphere /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
nginx -t

# Configure firewall
print_status "Configuring firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Start and enable services
print_status "Starting services..."
systemctl start nginx
systemctl enable nginx

# Start backend with PM2
print_status "Starting backend with PM2..."
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Set proper permissions
print_status "Setting proper permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

print_status "Deployment completed successfully!"
print_status "Next steps:"
echo "1. Configure your domain DNS to point to this VPS IP"
echo "2. Run: sudo certbot --nginx -d $DOMAIN"
echo "3. Create backend .env file with your environment variables"
echo "4. Restart the backend: pm2 restart booksphere-backend"

print_status "Your app will be available at: https://$DOMAIN"
print_status "Backend API will be available at: https://$DOMAIN/api"

