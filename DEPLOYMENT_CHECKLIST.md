# 🚀 BookSphere Hostinger VPS Deployment Checklist

## 📋 **Pre-Deployment Checklist**
- [ ] Hostinger VPS purchased and running
- [ ] SSH access to VPS confirmed
- [ ] Domain `booksphere.nerdsandgeeks.in` purchased
- [ ] GitHub repository ready
- [ ] MongoDB Atlas account created
- [ ] OpenAI API key obtained
- [ ] AWS S3 credentials ready (if using S3)

---

## 🔧 **VPS Setup (Run as root)**
- [ ] `apt update && apt upgrade -y`
- [ ] `apt install -y curl wget git nano ufw fail2ban htop`
- [ ] `curl -fsSL https://deb.nodesource.com/setup_18.x | bash -`
- [ ] `apt install -y nodejs`
- [ ] `npm install -g pm2`
- [ ] `apt install -y nginx`
- [ ] `apt install -y certbot python3-certbot-nginx`

---

## 📁 **Application Deployment**
- [ ] `mkdir -p /var/www/booksphere`
- [ ] `cd /var/www/booksphere`
- [ ] `git clone YOUR_REPO_URL .`
- [ ] `cd backend && npm install --production`
- [ ] `cd ../frontend && npm install && npm run build`
- [ ] `cd ..`

---

## ⚙️ **Configuration Files**
- [ ] Backend `.env` file created with production variables
- [ ] `ecosystem.config.js` created for PM2
- [ ] Nginx site configuration created
- [ ] Site enabled in Nginx
- [ ] Default Nginx site removed

---

## 🔒 **SSL & Security**
- [ ] Domain DNS points to VPS IP
- [ ] SSL certificate obtained via Certbot
- [ ] Firewall configured (SSH, HTTP, HTTPS)
- [ ] Proper file permissions set

---

## 🚀 **Start Services**
- [ ] Backend started with PM2
- [ ] PM2 configured to start on boot
- [ ] Nginx started and enabled
- [ ] All services running and accessible

---

## ✅ **Final Verification**
- [ ] Frontend accessible at https://booksphere.nerdsandgeeks.in
- [ ] Backend API accessible at https://booksphere.nerdsandgeeks.in/api
- [ ] SSL certificate working
- [ ] No errors in logs
- [ ] Services restart after reboot

---

## 🆘 **Quick Commands Reference**

### **Check Status**
```bash
pm2 status                    # Backend status
systemctl status nginx       # Nginx status
nginx -t                     # Test Nginx config
netstat -tlnp | grep :5000  # Check if backend listening
```

### **Restart Services**
```bash
pm2 restart booksphere-backend    # Restart backend
systemctl reload nginx            # Reload Nginx
systemctl restart nginx           # Restart Nginx
```

### **View Logs**
```bash
pm2 logs booksphere-backend       # Backend logs
tail -f /var/log/nginx/error.log # Nginx errors
tail -f /var/log/nginx/access.log # Nginx access
```

### **Update Application**
```bash
cd /var/www/booksphere
git pull origin main
cd backend && npm install --production
pm2 restart booksphere-backend
cd ../frontend && npm install && npm run build
systemctl reload nginx
```

---

## 🎯 **Success Indicators**
- ✅ Green checkmarks on all checklist items
- ✅ Website loads with HTTPS
- ✅ API endpoints respond correctly
- ✅ No error messages in logs
- ✅ Services auto-start after reboot

---

## 📞 **Need Help?**
- **PM2 Issues**: `pm2 logs booksphere-backend`
- **Nginx Issues**: `nginx -t && systemctl status nginx`
- **SSL Issues**: `certbot certificates`
- **System Issues**: `htop && df -h && free -h`

