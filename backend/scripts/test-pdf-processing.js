const mongoose = require('mongoose');
const Book = require('../models/Book');
const { processPDF } = require('../utils/ai');
const axios = require('axios');

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

// Test PDF processing
const testPDFProcessing = async () => {
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
    console.log(`   File URL: ${book.fileUrl}`);
    
    // Try to download the PDF from S3
    console.log('📥 Downloading PDF from S3...');
    try {
      const response = await axios.get(book.fileUrl, {
        responseType: 'arraybuffer'
      });
      
      console.log('✅ PDF downloaded successfully');
      console.log('   File size:', response.data.length, 'bytes');
      
      // Process the PDF
      console.log('🔍 Processing PDF content...');
      const text = await processPDF(response.data);
      
      console.log('✅ PDF processed successfully');
      console.log('   Text length:', text.length);
      console.log('   Text preview:', text.substring(0, 300) + '...');
      
    } catch (downloadError) {
      console.error('❌ Failed to download PDF:', downloadError.message);
      
      if (downloadError.response) {
        console.error('   Status:', downloadError.response.status);
        console.error('   Status Text:', downloadError.response.statusText);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing PDF processing:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
if (require.main === module) {
  testPDFProcessing();
}

module.exports = { testPDFProcessing };
