const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  institution: {
    type: String,
    // Optional globally; no default institution
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries (email has a unique index from the schema definition)
authorSchema.index({ createdAt: -1 });

// Virtual for password (not stored in DB)
authorSchema.virtual('password')
  .set(function(password) {
    this.passwordHash = bcrypt.hashSync(password, 12);
  })
  .get(function() {
    return this.passwordHash;
  });

// Instance method to check password
authorSchema.methods.checkPassword = function(password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

// Instance method to get public profile
authorSchema.methods.getPublicProfile = function() {
  const authorObject = this.toObject();
  delete authorObject.passwordHash;
  delete authorObject.__v;
  return authorObject;
};

// Pre-save middleware to hash password if modified
authorSchema.pre('save', function(next) {
  if (this.isModified('passwordHash') && !this.passwordHash.startsWith('$2a$')) {
    this.passwordHash = bcrypt.hashSync(this.passwordHash, 12);
  }
  next();
});

module.exports = mongoose.model('Author', authorSchema);
