# BookSphere - Render Deployment Guide

This guide will help you deploy BookSphere to Render's free tier.

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **MongoDB Atlas**: Free cluster for database
3. **AWS S3**: For file storage (free tier available)
4. **OpenAI API Key**: For AI chat functionality
5. **Render Account**: Free account at render.com

## Step 1: Prepare Your Services

### Backend Service (Web Service)

1. **Create New Web Service** on Render
2. **Connect GitHub Repository**
3. **Configure Settings**:
   - **Name**: `booksphere-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Frontend Service (Static Site)

1. **Create New Static Site** on Render
2. **Connect GitHub Repository**
3. **Configure Settings**:
   - **Name**: `booksphere-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free
   - **Headers**: Add custom header `/*` → `X-Frame-Options: DENY`
   - **Redirects/Rewrites**: Add rewrite rule `/*` → `/index.html` (status 200)

## Step 2: Environment Variables

### Backend Environment Variables

Add these in Render Dashboard → Your Backend Service → Environment:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/booksphere?retryWrites=true&w=majority

# Frontend URL (update after frontend deployment)
FRONTEND_URL=https://booksphere-frontend.onrender.com

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key-here

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Server Configuration
PORT=10000
NODE_ENV=production
```

### Frontend Environment Variables

Add these in Render Dashboard → Your Frontend Service → Environment:

```bash
# Backend API URL (update after backend deployment)
VITE_API_URL=https://booksphere-backend.onrender.com
```

## Step 3: Deployment Order

1. **Deploy Backend First**
   - Wait for backend to be healthy
   - Note the backend URL (e.g., `https://booksphere-backend.onrender.com`)

2. **Update Frontend Environment**
   - Update `VITE_API_URL` with your backend URL

3. **Deploy Frontend**
   - Wait for frontend to build successfully
   - Note the frontend URL (e.g., `https://booksphere-frontend.onrender.com`)

4. **Update Backend Environment**
   - Update `FRONTEND_URL` with your frontend URL
   - Redeploy backend

## Step 4: Free Tier Limitations

### Render Free Tier Limits:
- **Sleep after 15 minutes** of inactivity
- **512MB RAM** limit
- **0.1 CPU** limit
- **100GB bandwidth** per month

### Optimizations Made:
- Reduced rate limiting to 50 requests per 15 minutes
- Optimized health check endpoints
- Added proper error handling for free tier constraints

## Step 5: Testing Your Deployment

1. **Backend Health Check**:
   ```
   GET https://your-backend-url.onrender.com/api/health
   ```

2. **Frontend Access**:
   ```
   https://your-frontend-url.onrender.com
   ```

3. **Test QR Code Flow**:
   - Upload a book
   - Generate QR code
   - Scan QR code
   - Verify chat functionality

## Step 6: Custom Domains (Optional)

You can add custom domains in Render Dashboard:
- Backend: `api.yourdomain.com`
- Frontend: `yourdomain.com`

## Troubleshooting

### Common Issues:

1. **404 Errors on Routes** (e.g., `/register`, `/login`):
   - **Problem**: Static site hosting doesn't handle React Router routes
   - **Solution**: Add rewrite rule in Render Dashboard:
     - Go to your frontend service → Settings → Redirects & Rewrites
     - Add: `/*` → `/index.html` (Status: 200)
   - **Alternative**: Use the `_redirects` file in `public/` folder

2. **Backend Sleeps**: Free tier services sleep after 15 minutes of inactivity
   - First request after sleep takes ~30 seconds
   - Consider upgrading to paid plan for production

3. **CORS Errors**: Ensure `FRONTEND_URL` matches your actual frontend URL

4. **Build Failures**: Check build logs in Render Dashboard

5. **Environment Variables**: Ensure all required variables are set

### Logs and Monitoring:

- View logs in Render Dashboard
- Monitor service health
- Check build logs for errors

## Production Considerations

For production use, consider upgrading to:
- **Starter Plan** ($7/month): No sleep, more resources
- **Professional Plan** ($25/month): Better performance, custom domains

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- BookSphere Issues: Create GitHub issue

---

**Note**: Free tier services may experience cold starts and limited resources. For production use, consider upgrading to a paid plan.
