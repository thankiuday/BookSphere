# 🚀 BookSphere Deployment on Hostinger VPS - Step by Step

## 📋 **Prerequisites Checklist**
- [ ] Hostinger VPS with Ubuntu 20.04+ 
- [ ] SSH access to your VPS
- [ ] Domain `booksphere.nerdsandgeeks.in` pointing to your VPS IP
- [ ] GitHub repository with your BookSphere code
- [ ] MongoDB Atlas account (or local MongoDB)
- [ ] OpenAI API key
- [ ] AWS S3 credentials (if using S3)

---

## 🔧 **STEP 1: Connect to Your VPS**

### **1.1 Get VPS Details from Hostinger**
- Log into Hostinger control panel
- Go to VPS section
- Note down your VPS IP address
- Note down your root password

### **1.2 Connect via SSH**
```bash
# On Windows (PowerShell/CMD)
ssh root@YOUR_VPS_IP

# On Mac/Linux
ssh root@YOUR_VPS_IP

# Enter your root password when prompted
```

---

## 🖥️ **STEP 2: Initial VPS Setup**

### **2.1 Update System**
```bash
# Update package list
apt update

# Upgrade existing packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git nano ufw fail2ban htop
```

### **2.2 Install Node.js 18.x**
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -

# Install Node.js
apt install -y nodejs

# Verify installation
node --version
npm --version
```

**Expected Output:**
```
v18.x.x
9.x.x
```

### **2.3 Install PM2 (Process Manager)**
```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

---

## 🌐 **STEP 3: Install & Configure Nginx**

### **3.1 Install Nginx**
```bash
# Install Nginx
apt install -y nginx

# Start Nginx
systemctl start nginx

# Enable Nginx to start on boot
systemctl enable nginx

# Check status
systemctl status nginx
```

### **3.2 Create Application Directory**
```bash
# Create directory for your app
mkdir -p /var/www/booksphere

# Navigate to directory
cd /var/www/booksphere

# Set proper ownership
chown -R www-data:www-data /var/www/booksphere
```

---

## 📥 **STEP 4: Deploy Your Application**

### **4.1 Clone Your Repository**
```bash
# Navigate to app directory
cd /var/www/booksphere

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .

# If you get permission errors, use:
# git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git /var/www/booksphere/
# chown -R www-data:www-data /var/www/booksphere
```

### **4.2 Install Backend Dependencies**
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install --production

# Go back to root directory
cd ..
```

### **4.3 Install Frontend Dependencies & Build**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Go back to root directory
cd ..
```

---

## ⚙️ **STEP 5: Configure Environment Variables**

### **5.1 Create Backend .env File**
```bash
# Navigate to backend directory
cd /var/www/booksphere/backend

# Create .env file
nano .env
```

### **5.2 Add Environment Variables**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/booksphere?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
OPENAI_API_KEY=sk-your_openai_api_key_here
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket_name
```

**Save the file:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### **5.3 Set Proper Permissions**
```bash
# Set proper permissions for .env file
chmod 600 .env

# Go back to root directory
cd ..
```

---

## 🔄 **STEP 6: Configure PM2 Process Manager**

### **6.1 Create PM2 Configuration**
```bash
# Navigate to app directory
cd /var/www/booksphere

# Create ecosystem file
nano ecosystem.config.js
```

### **6.2 Add PM2 Configuration**
```javascript
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
```

**Save the file:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### **6.3 Create Logs Directory**
```bash
# Create logs directory
mkdir -p logs

# Set permissions
chown -R www-data:www-data logs
```

---

## 🌐 **STEP 7: Configure Nginx**

### **7.1 Create Nginx Site Configuration**
```bash
# Create Nginx site configuration
nano /etc/nginx/sites-available/booksphere
```

### **7.2 Add Nginx Configuration**
```nginx
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
```

**Save the file:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

### **7.3 Enable the Site**
```bash
# Create symbolic link to enable site
ln -sf /etc/nginx/sites-available/booksphere /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# If test passes, reload Nginx
systemctl reload nginx
```

---

## 🔒 **STEP 8: Configure SSL Certificate**

### **8.1 Install Certbot**
```bash
# Install Certbot for Nginx
apt install -y certbot python3-certbot-nginx
```

### **8.2 Obtain SSL Certificate**
```bash
# Get SSL certificate (make sure your domain points to this VPS first!)
certbot --nginx -d booksphere.nerdsandgeeks.in -d www.booksphere.nerdsandgeeks.in

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose redirect option 2 (redirect all traffic to HTTPS)
```

### **8.3 Test Auto-renewal**
```bash
# Test certificate renewal
certbot renew --dry-run
```

---

## 🚀 **STEP 9: Start Your Application**

### **9.1 Start Backend with PM2**
```bash
# Navigate to app directory
cd /var/www/booksphere

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Check status
pm2 status
```

### **9.2 Verify Everything is Running**
```bash
# Check PM2 status
pm2 status

# Check Nginx status
systemctl status nginx

# Check if backend is listening on port 5000
netstat -tlnp | grep :5000

# Check Nginx configuration
nginx -t
```

---

## 🔥 **STEP 10: Configure Firewall**

### **10.1 Setup UFW Firewall**
```bash
# Allow SSH
ufw allow ssh

# Allow HTTP and HTTPS
ufw allow 80
ufw allow 443

# Enable firewall
ufw --force enable

# Check status
ufw status
```

---

## 📱 **STEP 11: Domain DNS Configuration**

### **11.1 In Hostinger Control Panel**
- Go to your domain management
- Navigate to DNS settings
- Add/Update these records:

**A Record:**
- Name: `@` (or leave blank)
- Value: `YOUR_VPS_IP_ADDRESS`
- TTL: `300`

**CNAME Record:**
- Name: `www`
- Value: `booksphere.nerdsandgeeks.in`
- TTL: `300`

### **11.2 Wait for DNS Propagation**
- DNS changes can take 5-30 minutes
- You can check propagation at: https://www.whatsmydns.net/

---

## ✅ **STEP 12: Final Verification**

### **12.1 Test Your Application**
```bash
# Test frontend
curl -I https://booksphere.nerdsandgeeks.in

# Test backend API
curl -I https://booksphere.nerdsandgeeks.in/api/health

# Check SSL certificate
curl -I https://booksphere.nerdsandgeeks.in
```

### **12.2 Check Logs for Errors**
```bash
# Check PM2 logs
pm2 logs booksphere-backend

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Check Nginx access logs
tail -f /var/log/nginx/access.log
```

---

## 🐛 **Troubleshooting Common Issues**

### **Issue 1: Backend Not Starting**
```bash
# Check PM2 logs
pm2 logs booksphere-backend

# Check if port 5000 is in use
netstat -tlnp | grep :5000

# Restart backend
pm2 restart booksphere-backend
```

### **Issue 2: Nginx 502 Bad Gateway**
```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs booksphere-backend

# Test backend directly
curl http://localhost:5000/api/health
```

### **Issue 3: SSL Certificate Issues**
```bash
# Check certificate status
certbot certificates

# Renew certificate manually
certbot renew

# Check Nginx SSL configuration
nginx -t
```

### **Issue 4: Frontend Not Loading**
```bash
# Check if frontend files exist
ls -la /var/www/booksphere/frontend/dist/

# Check Nginx configuration
nginx -t

# Check Nginx error logs
tail -f /var/log/nginx/error.log
```

---

## 🔄 **Maintenance & Updates**

### **Update Backend**
```bash
cd /var/www/booksphere
git pull origin main
cd backend
npm install --production
pm2 restart booksphere-backend
```

### **Update Frontend**
```bash
cd frontend
npm install
npm run build
systemctl reload nginx
```

### **Check System Resources**
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
htop
```

---

## 📊 **Monitoring Commands**

### **PM2 Commands**
```bash
pm2 status          # Check app status
pm2 logs            # View logs
pm2 monit           # Monitor dashboard
pm2 restart all     # Restart all apps
pm2 stop all        # Stop all apps
pm2 delete all      # Delete all apps
```

### **Nginx Commands**
```bash
systemctl status nginx    # Check status
nginx -t                 # Test configuration
systemctl reload nginx    # Reload configuration
systemctl restart nginx   # Restart service
```

---

## 🎯 **Success Checklist**
- [ ] VPS accessible via SSH
- [ ] Node.js 18+ installed
- [ ] PM2 installed and configured
- [ ] Nginx installed and configured
- [ ] Application cloned and dependencies installed
- [ ] Frontend built successfully
- [ ] Backend .env file configured
- [ ] PM2 process running
- [ ] Nginx site enabled
- [ ] SSL certificate obtained
- [ ] Firewall configured
- [ ] Domain DNS configured
- [ ] Frontend accessible at https://booksphere.nerdsandgeeks.in
- [ ] Backend API accessible at https://booksphere.nerdsandgeeks.in/api
- [ ] All services starting on boot

---

## 🆘 **Need Help?**

### **Useful Commands for Debugging**
```bash
# Check all running services
systemctl list-units --type=service --state=running

# Check all listening ports
netstat -tlnp

# Check system resources
htop

# Check disk space
df -h

# Check memory usage
free -h
```

### **Log Files Location**
- **PM2 Logs**: `/var/www/booksphere/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/syslog`

### **Support Resources**
- **PM2 Documentation**: https://pm2.keymetrics.io/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **Hostinger Support**: https://www.hostinger.com/contact

---

## 🎉 **Congratulations!**

Your BookSphere application is now successfully deployed on Hostinger VPS at:
- **Frontend**: https://booksphere.nerdsandgeeks.in
- **Backend API**: https://booksphere.nerdsandgeeks.in/api

The application will automatically restart if the server reboots, and SSL certificates will auto-renew every 60 days.

