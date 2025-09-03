# BookSphere Deployment Guide for Hostinger VPS

## 🚀 **Deployment Overview**
- **Domain**: https://booksphere.nerdsandgeeks.in/
- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB (Atlas or local)

## 📋 **Prerequisites**
1. **Hostinger VPS Access** (SSH)
2. **Domain DNS Configuration**
3. **SSL Certificate** (Let's Encrypt)
4. **Node.js 18+** installed on VPS
5. **PM2** for process management
6. **Nginx** for reverse proxy

## 🔧 **VPS Setup Steps**

### 1. **Connect to VPS via SSH**
```bash
ssh root@your-vps-ip
```

### 2. **Install Node.js 18+**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### 3. **Install PM2 & Nginx**
```bash
npm install -g pm2
sudo apt update
sudo apt install nginx
```

### 4. **Create App Directory**
```bash
mkdir -p /var/www/booksphere
cd /var/www/booksphere
```

## 📁 **Project Structure on VPS**
```
/var/www/booksphere/
├── backend/          # Backend API
├── frontend/         # Built frontend files
├── nginx/           # Nginx configuration
└── ecosystem.config.js  # PM2 configuration
```

## 🔄 **Deployment Process**

### **Step 1: Clone & Setup Backend**
```bash
cd /var/www/booksphere
git clone <your-repo-url> .
cd backend
npm install
```

### **Step 2: Environment Configuration**
```bash
# Create .env file
nano backend/.env
```

**Backend Environment Variables:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket
```

### **Step 3: Build Frontend**
```bash
cd frontend
npm install
npm run build
```

### **Step 4: PM2 Configuration**
Create `ecosystem.config.js`:
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
    max_memory_restart: '1G'
  }]
};
```

### **Step 5: Start Backend**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 **Nginx Configuration**

### **Create Nginx Site Config**
```bash
sudo nano /etc/nginx/sites-available/booksphere
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name booksphere.nerdsandgeeks.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name booksphere.nerdsandgeeks.in;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/booksphere.nerdsandgeeks.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/booksphere.nerdsandgeeks.in/privkey.pem;
    
    # Frontend (Static Files)
    location / {
        root /var/www/booksphere/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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
    }
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### **Enable Site & Test**
```bash
sudo ln -s /etc/nginx/sites-available/booksphere /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 **SSL Certificate (Let's Encrypt)**

### **Install Certbot**
```bash
sudo apt install certbot python3-certbot-nginx
```

### **Obtain SSL Certificate**
```bash
sudo certbot --nginx -d booksphere.nerdsandgeeks.in
```

### **Auto-renewal**
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚀 **Start Services**

### **Start Backend**
```bash
pm2 start ecosystem.config.js
pm2 save
```

### **Start Nginx**
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 📊 **Monitoring & Maintenance**

### **PM2 Commands**
```bash
pm2 status          # Check app status
pm2 logs            # View logs
pm2 restart all     # Restart all apps
pm2 monit           # Monitor dashboard
```

### **Nginx Commands**
```bash
sudo systemctl status nginx
sudo nginx -t        # Test configuration
sudo systemctl reload nginx
```

## 🔄 **Update Process**

### **Update Backend**
```bash
cd /var/www/booksphere
git pull origin main
cd backend
npm install
pm2 restart booksphere-backend
```

### **Update Frontend**
```bash
cd frontend
npm install
npm run build
sudo systemctl reload nginx
```

## 🐛 **Troubleshooting**

### **Check Logs**
```bash
pm2 logs booksphere-backend
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### **Common Issues**
1. **Port 5000 blocked**: Check firewall settings
2. **SSL errors**: Verify certificate paths
3. **Nginx 502**: Check if backend is running
4. **CORS issues**: Verify proxy configuration

## 📱 **Domain DNS Setup**
- **A Record**: Point to your VPS IP
- **CNAME**: www → booksphere.nerdsandgeeks.in
- **TTL**: 300 seconds

## ✅ **Verification Checklist**
- [ ] Backend running on port 5000
- [ ] Frontend built and served by Nginx
- [ ] SSL certificate working
- [ ] API endpoints accessible
- [ ] Domain resolving correctly
- [ ] PM2 auto-start configured
- [ ] Nginx auto-start configured

## 🆘 **Support**
- **PM2 Documentation**: https://pm2.keymetrics.io/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/

