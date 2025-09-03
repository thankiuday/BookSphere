const express = require('express');
const { body, validationResult } = require('express-validator');
const Book = require('../models/Book');
const { auth } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { uploadToS3, deleteFromS3, generatePresignedUrl } = require('../utils/s3');
const { processBookUpload } = require('../utils/ai');
const { generateBookQRCode } = require('../utils/qrCode');

const router = express.Router();

// Validation middleware
const validateBookUpload = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('publicationYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Publication year must be between 1900 and current year'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string')
];

// @route   POST /api/books/upload
// @desc    Upload a new book
// @access  Private
router.post('/upload', 
  auth, 
  upload.single('pdfFile'),
  handleUploadError,
  validateBookUpload,
  async (req, res) => {
    let s3Result = null;
    let qrResult = null;
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please upload a PDF file'
        });
      }

      const {
        title,
        description,
        publicationYear,
        tags
      } = req.body;

      // Upload file to S3
      console.log('Uploading file to S3...');
      try {
        s3Result = await uploadToS3(req.file, req.file.originalname, 'books');
        console.log('File uploaded to S3:', s3Result.url);
      } catch (s3Error) {
        console.error('S3 upload failed:', s3Error.message);
        return res.status(500).json({
          error: 'S3 configuration error',
          message: 'File upload service is not configured. Please set up AWS S3 credentials in your .env file.',
          details: 'Missing AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or S3_BUCKET_NAME'
        });
      }

      // Generate unique subdomain
      console.log('Generating subdomain...');
      const subdomain = await Book.generateSubdomain(req.author.name, title);
      console.log('Subdomain generated:', subdomain);

      // Generate QR code
      console.log('Generating QR code...');
      try {
        qrResult = await generateBookQRCode(subdomain, { uploadToS3, generatePresignedUrl });
        console.log('QR code generated:', qrResult.qrCodeUrl);
      } catch (qrError) {
        console.error('QR code generation failed:', qrError.message);
        return res.status(500).json({
          error: 'QR code generation error',
          message: 'Failed to generate QR code. Please check S3 configuration.',
          details: qrError.message
        });
      }

      // Create book record first to get the ID
      const book = new Book({
        title,
        authorId: req.author._id,
        authorName: req.author.name,
        description,
        fileUrl: s3Result.url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        subdomain,
        qrCodeUrl: qrResult?.qrCodeUrl || null, // Safe access in case QR generation failed
        qrCodeKey: qrResult?.qrCodeKey || null,
        embeddingsIndex: 'temp', // Will be updated after save
        publicationYear: publicationYear ? parseInt(publicationYear) : undefined,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        isProcessed: false,
        processingStatus: 'processing'
      });

      await book.save();

      // Process book content (extract text and create embeddings)
      console.log('Processing book content...');
      try {
        const processingResult = await processBookUpload(req.file.buffer, title, book._id);
        console.log('Book processing completed, chunks:', processingResult.totalChunks);

        // Update book with processing results
        book.totalChunks = processingResult.totalChunks;
        book.isProcessed = true;
        book.processingStatus = 'completed';
        book.embeddingsIndex = `book_${book._id}`;
        await book.save();
      } catch (procErr) {
        console.error('Processing failed:', procErr.message);
        // Mark book as failed processing but keep initial record for retry/debug
        book.isProcessed = false;
        book.processingStatus = 'failed';
        book.processingError = procErr.message;
        await book.save();

        return res.status(500).json({
          error: 'Book upload failed',
          message: procErr.message
        });
      }

      // Generate pre-signed URL for download (expires in 1 hour)
      const downloadUrl = await generatePresignedUrl(book.fileUrl.split('/').slice(-2).join('/'), 3600);

      res.status(201).json({
        message: 'Book uploaded successfully',
        book: {
          id: book._id,
          title: book.title,
          subdomain: book.subdomain,
          qrCodeUrl: book.qrCodeUrl,
          bookUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat/${book.subdomain}`,
          fileUrl: book.fileUrl,
          downloadUrl: downloadUrl, // Pre-signed download link
          totalChunks: book.totalChunks,
          createdAt: book.createdAt
        }
      });

    } catch (error) {
      console.error('Book upload error:', error);
      console.error('Error stack:', error.stack);
      
      // Clean up uploaded file if book creation failed
      if (req.file && s3Result) {
        try {
          await deleteFromS3(s3Result.key);
        } catch (cleanupError) {
          console.error('Failed to cleanup S3 file:', cleanupError);
        }
      }

      res.status(500).json({
        error: 'Book upload failed',
        message: error.message || 'An error occurred while uploading the book'
      });
    }
  }
);

// @route   GET /api/books/my-books
// @desc    Get all books by the authenticated author
// @access  Private
router.get('/my-books', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const books = await Book.find({ authorId: req.author._id })
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-embeddingsIndex');

    const total = await Book.countDocuments({ authorId: req.author._id });

    // Add bookUrl and generate pre-signed download URLs for each book
    const booksWithUrls = await Promise.all(books.map(async (book) => {
      let downloadUrl = null;
      if (book.fileUrl) {
        try {
          const fileKey = book.fileUrl.split('/').slice(-2).join('/');
          downloadUrl = await generatePresignedUrl(fileKey, 3600);
        } catch (error) {
          console.error('Failed to generate presigned URL for book:', book.title, error.message);
          downloadUrl = book.fileUrl; // Fallback
        }
      }
      
      return {
        ...book.toObject(),
        bookUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat/${book.subdomain}`,
        downloadUrl: downloadUrl
      };
    }));

    res.json({
      books: booksWithUrls,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalBooks: total
    });

  } catch (error) {
    console.error('Get my books error:', error);
    res.status(500).json({
      error: 'Failed to fetch books',
      message: 'An error occurred while fetching your books'
    });
  }
});

// @route   GET /api/books/:subdomain/status
// @desc    Get book processing status
// @access  Public
router.get('/:subdomain/status', async (req, res) => {
  try {
    const { subdomain } = req.params;
    const book = await Book.findOne({ subdomain }).select('title isProcessed processingStatus totalChunks embeddingsIndex');
    
    if (!book) {
      return res.status(404).json({
        error: 'Book not found',
        message: 'The requested book could not be found'
      });
    }
    
    res.json({
      book: {
        title: book.title,
        isProcessed: book.isProcessed,
        processingStatus: book.processingStatus,
        totalChunks: book.totalChunks,
        embeddingsIndex: book.embeddingsIndex
      }
    });
  } catch (error) {
    console.error('Get book status error:', error);
    res.status(500).json({
      error: 'Failed to fetch book status',
      message: 'An error occurred while fetching the book status'
    });
  }
});

// @route   GET /api/books/:subdomain
// @desc    Get book by subdomain (public)
// @access  Public
router.get('/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;

    const book = await Book.findOne({ subdomain })
      .select('-embeddingsIndex')
      .populate('authorId', 'name department institution');

    if (!book) {
      return res.status(404).json({
        error: 'Book not found',
        message: 'The requested book could not be found'
      });
    }

    // Increment view count
    await book.incrementViewCount();

    // Generate pre-signed URL for download (expires in 1 hour)
    let downloadUrl = null;
    if (book.fileUrl) {
      try {
        const fileKey = book.fileUrl.split('/').slice(-2).join('/');
        downloadUrl = await generatePresignedUrl(fileKey, 3600);
      } catch (error) {
        console.error('Failed to generate presigned URL:', error.message);
        // Fallback to original fileUrl if presigned URL generation fails
        downloadUrl = book.fileUrl;
      }
    }

    res.json({
      book: {
        ...book.toObject(),
        bookUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat/${book.subdomain}`,
        fileUrl: book.fileUrl, // Direct PDF download link
        downloadUrl: downloadUrl, // Pre-signed download link
        isReadyForChat: book.isProcessed && book.processingStatus === 'completed'
      }
    });

  } catch (error) {
    console.error('Get book by subdomain error:', error);
    res.status(500).json({
      error: 'Failed to fetch book',
      message: 'An error occurred while fetching the book'
    });
  }
});

// @route   PUT /api/books/:id
// @desc    Update book details
// @access  Private
router.put('/:id', auth, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('publicationYear')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Publication year must be between 1900 and current year'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Find book and ensure it belongs to the author
    const book = await Book.findOne({ _id: id, authorId: req.author._id });
    if (!book) {
      return res.status(404).json({
        error: 'Book not found',
        message: 'The requested book could not be found'
      });
    }

    // Update book
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-embeddingsIndex');

    res.json({
      message: 'Book updated successfully',
      book: updatedBook
    });

  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      error: 'Book update failed',
      message: 'An error occurred while updating the book'
    });
  }
});

// @route   DELETE /api/books/:id
// @desc    Delete a book
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Find book and ensure it belongs to the author
    const book = await Book.findOne({ _id: id, authorId: req.author._id });
    if (!book) {
      return res.status(404).json({
        error: 'Book not found',
        message: 'The requested book could not be found'
      });
    }

    // Clean up S3 files (PDF and QR code)
    try {
      if (book.fileUrl) {
        // Attempt to delete using stored key if available
        const possibleKey = book.fileUrl.includes('amazonaws.com') ? book.fileUrl.split('/').slice(3).join('/') : null;
        if (possibleKey) {
          await deleteFromS3(possibleKey);
        }
        console.log('PDF file deletion attempted in S3');
      }
      
      if (book.qrCodeKey) {
        await deleteFromS3(book.qrCodeKey);
        console.log('QR code deleted from S3');
      }
    } catch (s3Error) {
      console.error('S3 cleanup error (non-fatal):', s3Error.message);
      // Continue with deletion even if S3 cleanup fails
    }

    // Clean up embeddings
    try {
      const { deleteEmbeddings } = require('../utils/embeddingStorage');
      await deleteEmbeddings(id);
      console.log('Embeddings deleted');
    } catch (embeddingError) {
      console.error('Embedding cleanup error (non-fatal):', embeddingError.message);
      // Continue with deletion even if embedding cleanup fails
    }

    // Delete book from database
    await Book.findByIdAndDelete(id);

    res.json({
      message: 'Book deleted successfully'
    });

  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      error: 'Book deletion failed',
      message: 'An error occurred while deleting the book'
    });
  }
});

// @route   GET /api/books/public/list
// @desc    Get list of public books
// @access  Public
router.get('/public/list', async (req, res) => {
  try {
    const { page = 1, limit = 12, search, subject } = req.query;
    
    const query = { isPublic: true };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-embeddingsIndex')
      .populate('authorId', 'name department institution');

    const total = await Book.countDocuments(query);

    res.json({
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalBooks: total
    });

  } catch (error) {
    console.error('Get public books error:', error);
    res.status(500).json({
      error: 'Failed to fetch books',
      message: 'An error occurred while fetching books'
    });
  }
});

module.exports = router;
