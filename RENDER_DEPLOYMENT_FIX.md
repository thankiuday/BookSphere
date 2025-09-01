# Render Deployment Fix Guide

## Issues Fixed

### 1. MongoDB Connection Error
**Problem**: `MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`

**Root Cause**: The application was trying to connect to localhost MongoDB instead of a cloud database.

**Solution**: 
- Updated `backend/config/env.js` to require `MONGODB_URI` in production
- Added proper validation for MongoDB connection string

### 2. Duplicate Schema Index Warnings
**Problem**: 
```
[MONGOOSE] Warning: Duplicate schema index on {"subdomain":1} found
[MONGOOSE] Warning: Duplicate schema index on {"sessionId":1} found
```

**Root Cause**: Fields with `unique: true` automatically create indexes, but we were also manually creating them.

**Solution**:
- Removed duplicate `bookSchema.index({ subdomain: 1 })` from `backend/models/Book.js`
- Removed duplicate `chatSchema.index({ sessionId: 1 })` from `backend/models/Chat.js`

## Required Environment Variables for Render

Set these in your Render dashboard under **Environment Variables**:

### Database (REQUIRED)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/booksphere?retryWrites=true&w=majority
```

### Application URLs (REQUIRED)
```
FRONTEND_URL=https://your-app-name.onrender.com
```

### Security (REQUIRED)
```
JWT_SECRET=your-super-secure-jwt-secret-key-here
```

### AI Services (REQUIRED)
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### File Storage (REQUIRED)
```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
```

### Server Configuration (REQUIRED)
```
PORT=10000
NODE_ENV=production
```

## How to Get Required Services

### 1. MongoDB Atlas (Free Tier Available)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free account
3. Create a new cluster
4. Create a database user
5. Get the connection string
6. Replace `<password>` with your actual password

### 2. OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account
3. Generate a new API key
4. Copy the key (starts with `sk-`)

### 3. AWS S3 (Free Tier Available)
1. Go to [AWS Console](https://aws.amazon.com)
2. Create an IAM user with S3 permissions
3. Create an S3 bucket
4. Get access keys from IAM user

### 4. JWT Secret
Generate a secure random string:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment Steps

1. **Set Environment Variables** in Render dashboard
2. **Connect your GitHub repository** to Render
3. **Deploy** - Render will automatically build and deploy

## Testing the Fix

After deployment, check:
1. **Health endpoint**: `https://your-app.onrender.com/api/health`
2. **Root endpoint**: `https://your-app.onrender.com/`
3. **Check logs** in Render dashboard for any remaining errors

## Common Issues

### Still getting MongoDB connection errors?
- Verify `MONGODB_URI` is set correctly in Render
- Check MongoDB Atlas cluster is running
- Ensure database user has proper permissions

### Getting CORS errors?
- Verify `FRONTEND_URL` matches your actual frontend URL
- Check that both frontend and backend are deployed

### File uploads not working?
- Verify all AWS S3 environment variables are set
- Check S3 bucket permissions
- Ensure IAM user has S3 access

## Next Steps

1. Deploy with the fixed code
2. Set all required environment variables
3. Test the application
4. Monitor logs for any remaining issues

The application should now deploy successfully without the MongoDB connection and duplicate index errors.
