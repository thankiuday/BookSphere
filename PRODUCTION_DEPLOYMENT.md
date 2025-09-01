# 🚀 Production Deployment Guide

## Overview
This guide covers deploying BookSphere to production on Render.com with proper subdomain and login functionality.

## ✅ What Works in Production

### **Subdomain System**
- ✅ **Dynamic URL Generation**: Subdomains now use `FRONTEND_URL` environment variable
- ✅ **QR Code Generation**: QR codes link to correct production URLs
- ✅ **Book URLs**: All book URLs are generated dynamically based on environment
- ✅ **CORS Configuration**: Properly configured for production domains

### **Authentication System**
- ✅ **JWT Authentication**: Secure token-based authentication
- ✅ **Password Hashing**: bcryptjs for secure password storage
- ✅ **Session Management**: Proper session handling
- ✅ **CORS Support**: Configured for production domains

## 🔧 Environment Variables Setup

### **Required Environment Variables**

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/booksphere?retryWrites=true&w=majority

# JWT Security
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# OpenAI API
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Server Configuration
PORT=10000
NODE_ENV=production

# Frontend URL (CRITICAL for subdomains)
FRONTEND_URL=https://your-app.onrender.com
```

### **Environment Variable Details**

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/booksphere` |
| `JWT_SECRET` | Secret key for JWT tokens | `my-super-secret-key-123456789` |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region for S3 bucket | `us-east-1` |
| `S3_BUCKET_NAME` | S3 bucket name for file storage | `my-booksphere-bucket` |
| `OPENAI_API_KEY` | OpenAI API key for AI features | `sk-proj-...` |
| `FRONTEND_URL` | **Your production domain** | `https://your-app.onrender.com` |

## 🌐 Domain Configuration

### **For Render.com Deployment**

1. **Set FRONTEND_URL in Render Dashboard:**
   ```
   FRONTEND_URL=https://your-app-name.onrender.com
   ```

2. **Custom Domain (Optional):**
   - Add custom domain in Render dashboard
   - Update `FRONTEND_URL` to your custom domain
   - Example: `FRONTEND_URL=https://booksphere.yourdomain.com`

### **Subdomain Examples**

With `FRONTEND_URL=https://your-app.onrender.com`:
- Book URL: `https://your-app.onrender.com/chat/john-doe-machine-learning`
- QR Code: Links to the same URL
- All generated URLs will use your production domain

## 🔐 Security Checklist

### **JWT Configuration**
- ✅ Use a strong, random JWT_SECRET (32+ characters)
- ✅ JWT tokens expire after 7 days
- ✅ Secure cookie settings in production

### **Database Security**
- ✅ MongoDB Atlas with network access restrictions
- ✅ Strong database passwords
- ✅ Connection string includes SSL

### **AWS S3 Security**
- ✅ IAM user with minimal required permissions
- ✅ S3 bucket with proper CORS configuration
- ✅ Private bucket with presigned URLs for downloads

### **API Security**
- ✅ Rate limiting enabled
- ✅ CORS properly configured
- ✅ Input validation on all endpoints
- ✅ Error messages don't expose sensitive information

## 📱 Frontend Configuration

### **Environment Variables (Frontend)**
Create `frontend/.env.production`:
```bash
VITE_API_URL=https://your-app.onrender.com/api
```

### **Build Process**
The frontend will be built automatically during deployment:
```bash
npm run install-all && cd frontend && npm run build
```

## 🚀 Deployment Steps

### **1. Prepare Your Environment**
```bash
# Clone the repository
git clone <your-repo-url>
cd BookSphere

# Install dependencies
npm run install-all
```

### **2. Configure Environment Variables**
- Set up MongoDB Atlas database
- Configure AWS S3 bucket
- Get OpenAI API key
- Generate strong JWT secret

### **3. Deploy to Render**
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure environment variables in Render dashboard
4. Deploy!

### **4. Test Production Features**
- ✅ User registration and login
- ✅ Book upload with PDF processing
- ✅ QR code generation
- ✅ Chat functionality with AI
- ✅ Subdomain URL generation

## 🔍 Troubleshooting

### **Common Issues**

**1. Subdomain URLs not working**
- Check `FRONTEND_URL` environment variable
- Ensure it includes `https://` protocol
- Verify the domain is accessible

**2. File uploads failing**
- Verify AWS S3 credentials
- Check S3 bucket permissions
- Ensure bucket CORS is configured

**3. Chat AI not responding**
- Verify OpenAI API key
- Check API key has sufficient credits
- Review server logs for errors

**4. Authentication issues**
- Verify JWT_SECRET is set
- Check MongoDB connection
- Ensure CORS is properly configured

### **Logs and Monitoring**
- Check Render logs for errors
- Monitor MongoDB Atlas metrics
- Review AWS CloudWatch for S3 issues
- Test OpenAI API connectivity

## 📊 Production Monitoring

### **Health Checks**
- Database connectivity
- S3 bucket access
- OpenAI API status
- JWT token validation

### **Performance Metrics**
- Response times
- File upload speeds
- AI response times
- Database query performance

## 🔄 Updates and Maintenance

### **Updating the Application**
1. Push changes to GitHub
2. Render will automatically redeploy
3. Test critical functionality
4. Monitor for any issues

### **Database Backups**
- MongoDB Atlas provides automatic backups
- Consider additional backup strategies
- Test restore procedures

### **Security Updates**
- Regularly update dependencies
- Monitor for security vulnerabilities
- Keep API keys and secrets secure

## ✅ Production Checklist

- [ ] All environment variables configured
- [ ] MongoDB Atlas database set up
- [ ] AWS S3 bucket configured
- [ ] OpenAI API key valid
- [ ] JWT_SECRET is strong and secure
- [ ] FRONTEND_URL points to production domain
- [ ] CORS properly configured
- [ ] SSL certificates valid
- [ ] Rate limiting enabled
- [ ] Error handling tested
- [ ] File uploads working
- [ ] Chat functionality tested
- [ ] QR codes generating correctly
- [ ] Subdomain URLs working
- [ ] Authentication flow tested
- [ ] Database backups configured
- [ ] Monitoring set up

## 🎉 Success!

Once deployed, your BookSphere application will have:
- ✅ **Working subdomains** with dynamic URL generation
- ✅ **Secure authentication** with JWT tokens
- ✅ **File uploads** to AWS S3
- ✅ **AI-powered chat** with OpenAI
- ✅ **QR code generation** for easy sharing
- ✅ **Responsive design** for all devices
- ✅ **Production-ready** security and performance

Your users can now:
1. Register and login securely
2. Upload PDF books
3. Get unique subdomains and QR codes
4. Share books via QR codes
5. Chat with book content using AI
6. Access books from any device

