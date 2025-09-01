const mongoose = require('mongoose');
const Book = require('../models/Book');
const { deleteEmbeddings } = require('../utils/embeddingStorage');

// Load environment variables
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const resetBookEmbeddings = async (bookId) => {
  try {
    console.log(`\n=== Resetting embeddings for book: ${bookId} ===`);
    
    // Find the book
    const book = await Book.findById(bookId);
    if (!book) {
      console.log('Book not found');
      return;
    }
    
    console.log(`Book found: ${book.title}`);
    console.log(`Current processing status: ${book.processingStatus}`);
    console.log(`Is processed: ${book.isProcessed}`);
    console.log(`Total chunks: ${book.totalChunks}`);
    
    // Delete existing embeddings
    console.log('Deleting existing embeddings...');
    await deleteEmbeddings(bookId);
    
    // Reset book processing status
    console.log('Resetting book processing status...');
    book.isProcessed = false;
    book.processingStatus = 'pending';
    book.totalChunks = 0;
    book.embeddingsIndex = 'temp';
    await book.save();
    
    console.log(`✅ Book "${book.title}" embeddings reset successfully!`);
    console.log(`Please re-upload the book to regenerate embeddings.`);
    
  } catch (error) {
    console.error(`❌ Error resetting embeddings for book ${bookId}:`, error);
  }
};

const main = async () => {
  try {
    await connectDB();
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('Usage: node reset-book-embeddings.js [bookId]');
      console.log('Example: node reset-book-embeddings.js 68b46b3b13c7c2dd2b4bbfb3');
      return;
    }
    
    const bookId = args[0];
    await resetBookEmbeddings(bookId);
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

main();
