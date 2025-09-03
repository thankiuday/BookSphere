const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    minlength: [1, 'Title cannot be empty'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: [true, 'Author ID is required']
  },
  authorName: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  subdomain: {
    type: String,
    required: [true, 'Subdomain is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens']
  },
  qrCodeUrl: {
    type: String,
    // QR code URL will be set after generation, not required initially
    default: null
  },
  qrCodeKey: {
    type: String,
    // S3 key used to manage lifecycle of the QR asset
    default: null
  },
  embeddingsIndex: {
    type: String,
    // Embeddings index will be set after processing, not required initially
    default: null
  },
  totalPages: {
    type: Number,
    default: 0
  },
  totalChunks: {
    type: Number,
    default: 0
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  publicationYear: {
    type: Number,
    min: [1900, 'Publication year must be after 1900'],
    max: [new Date().getFullYear(), 'Publication year cannot be in the future']
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  chatCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for faster queries
// Note: subdomain index is automatically created by unique: true in schema
bookSchema.index({ authorId: 1 });
bookSchema.index({ isPublic: 1 });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ viewCount: -1 });

// Virtual for full URL
bookSchema.virtual('fullUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/chat/${this.subdomain}`;
});

// Instance method to increment view count
bookSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Instance method to increment chat count
bookSchema.methods.incrementChatCount = function() {
  this.chatCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Static method to generate unique subdomain
bookSchema.statics.generateSubdomain = async function(authorName, title) {
  const baseSubdomain = `${authorName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${title.toLowerCase().replace(/[^a-z0-9]/g, '')}`.substring(0, 50);
  
  let subdomain = baseSubdomain;
  let counter = 1;
  
  while (await this.findOne({ subdomain })) {
    subdomain = `${baseSubdomain}-${counter}`;
    counter++;
  }
  
  return subdomain;
};

// Pre-save middleware to ensure subdomain is unique
bookSchema.pre('save', async function(next) {
  if (this.isModified('subdomain')) {
    const existingBook = await this.constructor.findOne({ 
      subdomain: this.subdomain,
      _id: { $ne: this._id }
    });
    
    if (existingBook) {
      throw new Error('Subdomain already exists');
    }
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema);
