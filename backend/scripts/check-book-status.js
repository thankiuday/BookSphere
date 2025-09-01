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

// Check book status
const checkBookStatus = async () => {
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
    console.log(`   Subdomain: ${book.subdomain}`);
    console.log(`   Is Processed: ${book.isProcessed}`);
    console.log(`   Processing Status: ${book.processingStatus}`);
    console.log(`   Total Chunks: ${book.totalChunks}`);
    console.log(`   Embeddings Index: ${book.embeddingsIndex}`);
    console.log(`   File URL: ${book.fileUrl}`);
    
    // Check if embeddings file exists
    const fs = require('fs').promises;
    const path = require('path');
    const embeddingsPath = path.join(__dirname, '../data/embeddings', `${book._id}.json`);
    
    try {
      await fs.access(embeddingsPath);
      console.log('✅ Embeddings file exists');
      
      // Read and check embeddings file
      const embeddingsData = JSON.parse(await fs.readFile(embeddingsPath, 'utf8'));
      console.log(`   Chunks count: ${embeddingsData.chunks.length}`);
      console.log(`   First chunk preview: ${embeddingsData.chunks[0].substring(0, 100)}...`);
      
    } catch (error) {
      console.log('❌ Embeddings file does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking book status:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
if (require.main === module) {
  checkBookStatus();
}

module.exports = { checkBookStatus };
