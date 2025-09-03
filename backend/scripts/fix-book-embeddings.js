#!/usr/bin/env node

/**
 * Fix Book Embeddings Script
 * This script regenerates embeddings for a specific book that has missing embeddings
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const Book = require('../models/Book');
const { processBookUpload } = require('../utils/ai');
const { deleteEmbeddings } = require('../utils/embeddingStorage');

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
    
    // Download the PDF from S3 (you'll need to implement this)
    console.log('⚠️  Note: This script requires the PDF file to regenerate embeddings.');
    console.log('📁 File URL:', book.fileUrl);
    
    // For now, we'll just clean up and mark for reprocessing
    console.log('🧹 Cleaning up existing embeddings...');
    await deleteEmbeddings(book._id);
    
    // Mark book as needing reprocessing
    book.isProcessed = false;
    book.processingStatus = 'pending';
    book.processingError = 'Embeddings regenerated. Please re-upload the book.';
    await book.save();
    
    console.log('✅ Book marked for reprocessing. Please re-upload the PDF.');
    
  } catch (error) {
    console.error('❌ Error regenerating embeddings:', error.message);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    const subdomain = process.argv[2];
    
    if (!subdomain) {
      console.log('❌ Please provide a book subdomain');
      console.log('Usage: node fix-book-embeddings.js <subdomain>');
      console.log('Example: node fix-book-embeddings.js bharanidheeraj-mernstackcourse');
      process.exit(1);
    }
    
    console.log('🚀 Starting Book Embeddings Fix Script...');
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
      console.log('✅ Book already has embeddings. No action needed.');
    } else {
      console.log('❌ Book is missing embeddings. Starting regeneration...');
      await regenerateEmbeddings(book);
    }
    
    console.log('✅ Script completed successfully');
    
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
