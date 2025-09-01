const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isRestricted: {
    type: Boolean,
    default: false
  }
});

const chatSchema = new mongoose.Schema({
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [messageSchema],
  totalMessages: {
    type: Number,
    default: 0
  },
  restrictedMessages: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
chatSchema.index({ bookId: 1 });
chatSchema.index({ sessionId: 1 });
chatSchema.index({ startedAt: -1 });
chatSchema.index({ lastActivity: -1 });

// Instance method to add message
chatSchema.methods.addMessage = function(role, content, isRestricted = false) {
  // Validate content is not empty
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error(`Cannot add message with empty content for role: ${role}`);
  }
  
  this.messages.push({
    role,
    content: content.trim(),
    isRestricted,
    timestamp: new Date()
  });
  
  this.totalMessages += 1;
  if (isRestricted) {
    this.restrictedMessages += 1;
  }
  this.lastActivity = new Date();
  
  return this.save();
};

// Instance method to get recent messages
chatSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit);
};

// Static method to create new chat session
chatSchema.statics.createSession = function(bookId, sessionId, userAgent, ipAddress) {
  return this.create({
    bookId,
    sessionId,
    userAgent,
    ipAddress
  });
};

// Pre-save middleware to update last activity
chatSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

module.exports = mongoose.model('Chat', chatSchema);
