# BookSphere Development Setup

## Quick Setup for Development

### 1. Environment Configuration

Copy the environment example file and configure it:

```bash
# In the backend directory
cp env.example .env
```

### 2. Required Environment Variables

For basic functionality, you need these minimum variables in `backend/.env`:

```env
# Database (Required)
MONGODB_URI=your_mongodb_connection_string

# JWT (Required)
JWT_SECRET=your_jwt_secret_key

# OpenAI (Required for AI features)
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=5000
NODE_ENV=development
```

### 3. Optional Environment Variables

For full functionality, also add:

```env
# AWS S3 (For file uploads)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Start Development

```bash
# Install dependencies
npm run install-all

# Start both frontend and backend
npm run dev
```

## Features by Configuration

### Basic Setup (Minimal)
- ✅ Frontend UI
- ✅ Backend API
- ✅ Database operations
- ❌ AI chat features
- ❌ File uploads

### Full Setup (Complete)
- ✅ Frontend UI
- ✅ Backend API
- ✅ Database operations
- ✅ AI chat features
- ✅ File uploads

## Troubleshooting

### Backend Crashes on Startup
- Check if `.env` file exists in `backend/` directory
- Verify `MONGODB_URI` is set correctly
- Ensure `JWT_SECRET` is provided

### AI Features Not Working
- Verify `OPENAI_API_KEY` is set in `.env`
- Check OpenAI API key is valid and has credits

### File Upload Issues
- Configure AWS S3 credentials
- Ensure S3 bucket exists and is accessible
