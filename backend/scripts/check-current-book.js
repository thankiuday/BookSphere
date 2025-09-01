const mongoose = require('mongoose');
const Book = require('../models/Book');
const { loadEmbeddings } = require('../utils/embeddingStorage');

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

// Check all books and their status
const checkAllBooks = async () => {
  try {
    await connectDB();
    
    console.log('📚 Checking all books in the system...\n');
    
    const books = await Book.find({}).select('title subdomain isProcessed processingStatus totalChunks embeddingsIndex');
    
    if (books.length === 0) {
      console.log('❌ No books found in the system');
      return;
    }
    
    for (const book of books) {
      console.log(`📖 Book: ${book.title}`);
      console.log(`   Subdomain: ${book.subdomain}`);
      console.log(`   ID: ${book._id}`);
      console.log(`   Is Processed: ${book.isProcessed}`);
      console.log(`   Processing Status: ${book.processingStatus}`);
      console.log(`   Total Chunks: ${book.totalChunks}`);
      console.log(`   Embeddings Index: ${book.embeddingsIndex}`);
      
      // Test embeddings loading
      try {
        const vectorStore = await loadEmbeddings(book._id);
        if (vectorStore) {
          console.log('   ✅ Embeddings loaded successfully');
          
          // Try a simple search
          const results = await vectorStore.similaritySearch('content', 1);
          console.log(`   ✅ Search test: Found ${results.length} results`);
        } else {
          console.log('   ❌ Failed to load embeddings');
        }
      } catch (error) {
        console.log(`   ❌ Embeddings error: ${error.message}`);
      }
      
      console.log('   ---');
    }
    
  } catch (error) {
    console.error('❌ Error checking books:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
if (require.main === module) {
  checkAllBooks();
}

module.exports = { checkAllBooks };
