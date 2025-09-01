const fs = require('fs').promises;
const path = require('path');
const Book = require('../models/Book');
const { processBookUpload } = require('../utils/ai');
const { uploadToS3 } = require('../utils/s3');

// Script to regenerate embeddings for existing books
const regenerateEmbeddings = async () => {
  try {
    console.log('Starting embeddings regeneration...');
    
    // Get all books that need regeneration
    const books = await Book.find({ isProcessed: true });
    console.log(`Found ${books.length} books to process`);
    
    for (const book of books) {
      try {
        console.log(`Processing book: ${book.title} (${book._id})`);
        
        // Download the PDF from S3
        const pdfBuffer = await downloadFromS3(book.fileUrl);
        
        // Reprocess the book
        const processingResult = await processBookUpload(pdfBuffer, book.title, book._id);
        
        // Update book record
        book.totalChunks = processingResult.totalChunks;
        book.isProcessed = true;
        book.processingStatus = 'completed';
        book.embeddingsIndex = `book_${book._id}`;
        await book.save();
        
        console.log(`✅ Successfully regenerated embeddings for: ${book.title}`);
      } catch (error) {
        console.error(`❌ Failed to regenerate embeddings for ${book.title}:`, error.message);
      }
    }
    
    console.log('Embeddings regeneration completed!');
  } catch (error) {
    console.error('Error during embeddings regeneration:', error);
  }
};

// Helper function to download from S3 (you'll need to implement this)
const downloadFromS3 = async (fileUrl) => {
  // This is a placeholder - you'll need to implement S3 download
  // For now, we'll just delete the old embeddings file
  throw new Error('S3 download not implemented - please re-upload the book manually');
};

// Run the script
if (require.main === module) {
  regenerateEmbeddings();
}

module.exports = { regenerateEmbeddings };
