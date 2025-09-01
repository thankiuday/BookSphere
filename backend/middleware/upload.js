const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (for processing before S3 upload)
const storage = multer.memoryStorage();

// File filter to only allow PDFs
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  
  // Check file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    return cb(new Error('File size too large. Maximum size is 50MB'), false);
  }
  
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1 // Only allow 1 file
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 50MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Only one file can be uploaded at a time'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field',
        message: 'Please use the correct field name for file upload'
      });
    }
  }
  
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only PDF files are allowed'
    });
  }
  
  if (error.message === 'File size too large. Maximum size is 50MB') {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size must be less than 50MB'
    });
  }
  
  console.error('Upload error:', error);
  res.status(500).json({
    error: 'File upload failed',
    message: 'An error occurred while uploading the file'
  });
};

module.exports = { upload, handleUploadError };
