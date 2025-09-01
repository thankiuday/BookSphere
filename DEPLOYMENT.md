# BookSphere Deployment Guide

This guide will help you deploy the BookSphere application to Render.

## Prerequisites

Before deploying, ensure you have:

1. **MongoDB Atlas Account**
   - Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Get your connection string

2. **AWS S3 Bucket**
   - Create an S3 bucket for file storage
   - Create an IAM user with S3 access
   - Get Access Key ID and Secret Access Key

3. **OpenAI API Key**
   - Sign up at [OpenAI](https://platform.openai.com/)
   - Generate an API key

4. **GitHub Account**
   - Push this code to a GitHub repository

## Local Development

To run the project locally with Vite:

```bash
# Install all dependencies
npm run install-all

# Start development servers
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend Vite dev server on http://localhost:3000

## Step 1: Prepare Your Repository

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/booksphere.git
   git push -u origin main
   ```

## Step 2: Deploy to Render

1. **Sign up/Login to Render**
   - Go to [Render](https://render.com)
   - Sign up or login with your GitHub account

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing BookSphere

3. **Configure the Service**
   - **Name**: `booksphere-app`
   - **Environment**: `Node`
   - **Build Command**: `npm run install-all && cd frontend && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Choose "Starter" (free tier)

4. **Set Environment Variables**
   Click "Environment" and add these variables:

   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/booksphere?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-s3-bucket-name
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=10000
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application

## Step 3: Configure Domain (Optional)

1. **Custom Domain Setup**
   - In your Render dashboard, go to your service
   - Click "Settings" → "Custom Domains"
   - Add your domain (e.g., `booksphere.yourdomain.com`)

2. **Subdomain Configuration**
   - For the subdomain feature to work, you'll need to configure DNS
   - Add a wildcard CNAME record: `*.gardencityuniversity.in` → `your-app.onrender.com`

## Step 4: Verify Deployment

1. **Check Application Health**
   - Visit your Render URL
   - Test the main functionality

2. **Test Features**
   - Register an author account
   - Upload a test PDF
   - Generate QR code
   - Test chat functionality

## Environment Variables Explained

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key | Yes |
| `AWS_REGION` | AWS region (e.g., us-east-1) | Yes |
| `S3_BUCKET_NAME` | S3 bucket name for file storage | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes |
| `NODE_ENV` | Environment (production/development) | Yes |
| `PORT` | Port for the application | Yes |

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check if all dependencies are properly listed in package.json
   - Verify Node.js version compatibility

2. **Environment Variables Not Set**
   - Double-check all environment variables are set in Render
   - Ensure no typos in variable names

3. **MongoDB Connection Issues**
   - Verify MongoDB Atlas IP whitelist includes Render's IPs
   - Check connection string format

4. **S3 Upload Issues**
   - Verify AWS credentials are correct
   - Check S3 bucket permissions
   - Ensure bucket is in the correct region

### Logs and Debugging

1. **View Logs**
   - In Render dashboard, go to your service
   - Click "Logs" tab to view real-time logs

2. **Common Error Messages**
   - `ECONNREFUSED`: Database connection issue
   - `AccessDenied`: AWS S3 permissions issue
   - `Invalid API Key`: OpenAI API key issue

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong, unique JWT secrets
   - Rotate API keys regularly

2. **Database Security**
   - Use MongoDB Atlas security features
   - Enable network access controls
   - Use strong passwords

3. **File Upload Security**
   - Validate file types and sizes
   - Scan uploaded files for malware
   - Use secure S3 bucket policies

## Monitoring and Maintenance

1. **Health Checks**
   - Monitor application uptime
   - Set up alerts for errors
   - Track performance metrics

2. **Backup Strategy**
   - Regular MongoDB backups
   - S3 bucket versioning
   - Code repository backups

3. **Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Test updates in staging environment

## Support

If you encounter issues:

1. Check the logs in Render dashboard
2. Verify all environment variables are set correctly
3. Test locally to isolate issues
4. Check the GitHub repository for known issues

## Cost Optimization

1. **Render Free Tier**
   - 750 hours/month free
   - Service sleeps after 15 minutes of inactivity
   - Consider upgrading for production use

2. **MongoDB Atlas**
   - Free tier includes 512MB storage
   - Monitor usage to avoid charges

3. **AWS S3**
   - Pay only for storage and transfer
   - Use lifecycle policies to manage costs

4. **OpenAI API**
   - Pay per API call
   - Monitor usage to control costs
