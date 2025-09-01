# Backend Setup Guide

## Environment Variables Setup

The 500 Internal Server Error you're experiencing is likely due to missing environment variables. Follow these steps to set up your backend:

### 1. Create Environment File

Create a `.env` file in the `backend` directory with the following content:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/booksphere

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production

# AWS S3 (Required for file uploads)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# OpenAI (Required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 2. Required Services Setup

#### MongoDB
- **Option 1**: Install MongoDB locally
- **Option 2**: Use MongoDB Atlas (cloud service)
- **Option 3**: Use Docker: `docker run -d -p 27017:27017 --name mongodb mongo:latest`

#### AWS S3
1. Create an AWS account
2. Create an S3 bucket
3. Create an IAM user with S3 permissions
4. Get the Access Key ID and Secret Access Key

#### OpenAI
1. Create an OpenAI account
2. Get your API key from https://platform.openai.com/api-keys

### 3. Quick Test Setup (Minimal Configuration)

For testing purposes, you can use this minimal configuration:

```env
# Database (local MongoDB)
MONGODB_URI=mongodb://localhost:27017/booksphere

# JWT
JWT_SECRET=test_secret_key_123

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Note**: With this minimal setup, file uploads and AI features will fail, but the server will start and you can test basic functionality.

### 4. Start the Server

```bash
cd backend
npm install
npm start
```

### 5. Verify Setup

The server should start without errors and show:
```
✅ Connected to MongoDB
🚀 Server running on port 5000
📚 BookSphere API ready for Garden City University
🌍 Environment: development
```

If you see configuration errors, the server will tell you exactly which environment variables are missing.

### 6. Test the API

Once the server is running, test the health endpoint:
```bash
curl http://localhost:5000/api/health
```

You should get:
```json
{"status":"OK","message":"BookSphere API is running"}
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Make sure MongoDB is running
   - Check the connection string in MONGODB_URI

2. **S3 Upload Errors**
   - Verify AWS credentials are correct
   - Check S3 bucket name and permissions
   - Ensure the bucket exists and is accessible

3. **OpenAI API Errors**
   - Verify your OpenAI API key is valid
   - Check your OpenAI account has sufficient credits

4. **CORS Errors**
   - Make sure FRONTEND_URL matches your frontend URL
   - Check that the frontend is running on the correct port

### Error Messages

The server now provides detailed error messages for missing configuration. Look for messages like:
- "AWS_ACCESS_KEY_ID is required for S3 file uploads"
- "OPENAI_API_KEY is required for AI features"

These will tell you exactly what needs to be configured.
