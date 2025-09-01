// Environment configuration with helpful error messages
const config = {
  // Database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/booksphere'
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production'
  },
  
  // AWS S3
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.S3_BUCKET_NAME
  },
  
  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  
  // Server
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  }
};

// Validate required environment variables
const validateConfig = () => {
  const errors = [];
  
  // Only validate S3 and OpenAI in production
  if (config.server.nodeEnv === 'production') {
    if (!config.s3.accessKeyId) {
      errors.push('AWS_ACCESS_KEY_ID is required for S3 file uploads');
    }
    
    if (!config.s3.secretAccessKey) {
      errors.push('AWS_SECRET_ACCESS_KEY is required for S3 file uploads');
    }
    
    if (!config.s3.bucketName) {
      errors.push('S3_BUCKET_NAME is required for S3 file uploads');
    }
    
    if (!config.openai.apiKey) {
      errors.push('OPENAI_API_KEY is required for AI features');
    }
  } else {
    // In development, just warn about missing variables
    if (!config.s3.accessKeyId || !config.s3.secretAccessKey || !config.s3.bucketName) {
      console.warn('⚠️  S3 configuration missing - file uploads will fail');
    }
    
    if (!config.openai.apiKey) {
      console.warn('⚠️  OpenAI API key missing - AI features will fail');
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment configuration errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.error('\n📝 Please create a .env file in the backend directory with the required variables.');
    console.error('📄 See env.example for the required format.');
    return false;
  }
  
  return true;
};

module.exports = { config, validateConfig };
