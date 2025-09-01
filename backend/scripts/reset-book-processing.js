const mongoose = require('mongoose');
const Book = require('../models/Book');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booksphere');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Reset book processing status
const resetBookProcessing = async () => {
  try {
    await connectDB();
    
    // Find the specific book
    const book = await Book.findOne({ subdomain: 'udaythanki-choicebased' });
    
    if (!book) {
      console.log('❌ Book not found');
      return;
    }
    
    // Reset processing status
    book.isProcessed = false;
    book.processingStatus = 'pending';
    book.totalChunks = 0;
    book.embeddingsIndex = 'temp';
    await book.save();
    
    console.log(`✅ Reset processing status for book: ${book.title}`);
    console.log('Now you can re-upload the book to regenerate embeddings');
    
  } catch (error) {
    console.error('❌ Error resetting book processing:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
if (require.main === module) {
  resetBookProcessing();
}

module.exports = { resetBookProcessing };
