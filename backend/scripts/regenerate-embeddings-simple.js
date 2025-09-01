const mongoose = require('mongoose');
const Book = require('../models/Book');
const { processBookUpload } = require('../utils/ai');
const { deleteEmbeddings } = require('../utils/embeddingStorage');

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

// Regenerate embeddings for the specific book
const regenerateEmbeddings = async () => {
  try {
    await connectDB();
    
    // Find the specific book
    const book = await Book.findOne({ subdomain: 'udaythanki-choicebased' });
    
    if (!book) {
      console.log('❌ Book not found with subdomain: udaythanki-choicebased');
      return;
    }
    
    console.log('📚 Book found:');
    console.log(`   Title: ${book.title}`);
    console.log(`   ID: ${book._id}`);
    console.log(`   Current processing status: ${book.processingStatus}`);
    
    // Reset processing status
    book.isProcessed = false;
    book.processingStatus = 'processing';
    book.totalChunks = 0;
    book.embeddingsIndex = 'temp';
    await book.save();
    
    console.log('🔄 Reset book processing status');
    
    // Delete existing embeddings file if it exists
    try {
      await deleteEmbeddings(book._id);
      console.log('🗑️ Deleted existing embeddings file');
    } catch (error) {
      console.log('ℹ️ No existing embeddings file to delete');
    }
    
    console.log('⚠️ IMPORTANT: You need to re-upload the book to regenerate embeddings');
    console.log('   The book processing status has been reset');
    console.log('   Please go to your author dashboard and re-upload the same PDF file');
    
  } catch (error) {
    console.error('❌ Error regenerating embeddings:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
if (require.main === module) {
  regenerateEmbeddings();
}

module.exports = { regenerateEmbeddings };
