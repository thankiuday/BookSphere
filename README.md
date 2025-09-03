# BookSphere - AI-Powered Book Chat Platform

A production-ready MERN stack application that allows authors worldwide to upload books and readers to chat with book content through AI-powered conversations.

## Features

- **Author Portal**: Upload PDF books, get unique subdomains and QR codes
- **Reader Interface**: Chat with book content through AI-powered conversations
- **Content Restriction**: AI responses are limited to book content only
- **Modern UI**: Responsive Tailwind CSS design for global authors and readers
- **Production Ready**: Configured for deployment on Render

## Tech Stack

- **Frontend**: React + Vite + JavaScript (JSX) + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **File Storage**: AWS S3
- **AI**: LangChain with embeddings
- **Vector Search**: MongoDB Atlas Vector Search
- **QR Codes**: qrcode npm package

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- AWS S3 bucket
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend directory
   - Fill in your configuration values

4. Start development servers:
   ```bash
   npm run dev
   ```
   This will start:
   - Backend server on http://localhost:5000
   - Frontend Vite dev server on http://localhost:3000

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
S3_BUCKET_NAME=your_s3_bucket_name
OPENAI_API_KEY=your_openai_api_key
PORT=5000
NODE_ENV=development
```

## Deployment on Render

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy using the provided build configuration

## Project Structure

```
├── backend/                 # Express server
│   ├── routes/             # API routes
│   ├── models/             # MongoDB models
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
├── frontend/               # React + Vite + JavaScript application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── utils/          # Frontend utilities
│   ├── index.html          # Vite entry point
│   └── vite.config.js      # Vite configuration
└── package.json            # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Author registration
- `POST /api/auth/login` - Author login

### Books
- `POST /api/books/upload` - Upload book PDF
- `GET /api/books/:subdomain` - Get book by subdomain

### Chat
- `POST /api/chat` - Chat with book content

## License

MIT License - BookSphere Team
