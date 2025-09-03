#!/usr/bin/env node

/**
 * Complete Book Embeddings Regeneration Script
 * This script downloads the PDF from S3 and regenerates embeddings
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const { processBookUpload } = require('../utils/ai');
const { deleteEmbeddings } = require('../utils/embeddingStorage');
const { downloadFromS3 } = require('../utils/s3');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Download PDF from S3 using your S3 utility
const downloadPDF = async (fileUrl) => {
  try {
    console.log('📥 Downloading PDF from S3:', fileUrl);
    
    const pdfBuffer = await downloadFromS3(fileUrl);
    
    console.log('✅ PDF downloaded successfully');
    console.log('📊 File size:', (pdfBuffer.length / 1024 / 1024).toFixed(2), 'MB');
    
    return pdfBuffer;
  } catch (error) {
    console.error('❌ PDF download failed:', error.message);
    throw new Error(`Failed to download PDF: ${error.message}`);
  }
};

// Find book by subdomain
const findBook = async (subdomain) => {
  try {
    const book = await Book.findOne({ subdomain });
    if (!book) {
      throw new Error(`Book with subdomain '${subdomain}' not found`);
    }
    return book;
  } catch (error) {
    console.error('❌ Error finding book:', error.message);
    throw error;
  }
};

// Check if book has embeddings
const checkEmbeddings = async (bookId) => {
  try {
    const { embeddingsExist } = require('../utils/embeddingStorage');
    const exists = await embeddingsExist(bookId);
    return exists;
  } catch (error) {
    console.error('❌ Error checking embeddings:', error.message);
    return false;
  }
};

// Regenerate embeddings for a book
const regenerateEmbeddings = async (book) => {
  try {
    console.log(`🔄 Regenerating embeddings for book: ${book.title}`);
    console.log(`📚 Book ID: ${book._id}`);
    console.log(`🔗 Subdomain: ${book.subdomain}`);
    
    // Check if book has a file URL
    if (!book.fileUrl) {
      throw new Error('Book has no file URL. Cannot regenerate embeddings.');
    }
    
    // Download the PDF from S3
    const pdfBuffer = await downloadPDF(book.fileUrl);
    
    // Clean up existing embeddings
    console.log('🧹 Cleaning up existing embeddings...');
    await deleteEmbeddings(book._id);
    
    // Mark book as processing
    book.isProcessed = false;
    book.processingStatus = 'processing';
    book.processingError = null;
    await book.save();
    
    // Process the book and generate new embeddings
    console.log('🔄 Processing book content and generating embeddings...');
    const processingResult = await processBookUpload(pdfBuffer, book.title, book._id);
    
    // Update book with new processing results
    book.totalChunks = processingResult.totalChunks;
    book.isProcessed = true;
    book.processingStatus = 'completed';
    book.embeddingsIndex = `book_${book._id}`;
    book.processingError = null;
    await book.save();
    
    console.log('✅ Embeddings regenerated successfully!');
    console.log(`📊 Total chunks: ${processingResult.totalChunks}`);
    
  } catch (error) {
    console.error('❌ Error regenerating embeddings:', error.message);
    
    // Mark book as failed
    book.isProcessed = false;
    book.processingStatus = 'failed';
    book.processingError = error.message;
    await book.save();
    
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    const subdomain = process.argv[2];
    
    if (!subdomain) {
      console.log('❌ Please provide a book subdomain');
      console.log('Usage: node regenerate-embeddings-complete.js <subdomain>');
      console.log('Example: node regenerate-embeddings-complete.js bharanidheeraj-mernstackcourse');
      process.exit(1);
    }
    
    console.log('🚀 Starting Complete Book Embeddings Regeneration...');
    console.log(`🔍 Looking for book with subdomain: ${subdomain}`);
    
    // Connect to database
    await connectDB();
    
    // Find the book
    const book = await findBook(subdomain);
    console.log(`✅ Found book: ${book.title}`);
    
    // Check current embeddings status
    const hasEmbeddings = await checkEmbeddings(book._id);
    console.log(`📊 Current embeddings status: ${hasEmbeddings ? 'EXISTS' : 'MISSING'}`);
    
    if (hasEmbeddings) {
      console.log('⚠️  Book already has embeddings.');
      const answer = process.argv[3];
      if (answer !== '--force') {
        console.log('💡 Use --force flag to regenerate anyway:');
        console.log(`   node regenerate-embeddings-complete.js ${subdomain} --force`);
        process.exit(0);
      }
      console.log('🔄 Force regenerating embeddings...');
    }
    
    // Regenerate embeddings
    await regenerateEmbeddings(book);
    
    console.log('✅ Script completed successfully');
    console.log(`🎉 Book "${book.title}" is now ready for chat!`);
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
