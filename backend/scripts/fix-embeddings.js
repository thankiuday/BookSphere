const mongoose = require('mongoose');
const Book = require('../models/Book');
const { processBookUpload } = require('../utils/ai');
const { deleteEmbeddings } = require('../utils/embeddingStorage');
const { downloadFromS3 } = require('../utils/s3');

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

const fixBookEmbeddings = async (bookId) => {
  try {
    console.log(`\n=== Fixing embeddings for book: ${bookId} ===`);
    
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
    
    // Download PDF from S3
    console.log('Downloading PDF from S3...');
    const pdfBuffer = await downloadFromS3(book.fileUrl);
    console.log('PDF downloaded, size:', pdfBuffer.length, 'bytes');
    
    // Reset book processing status
    console.log('Resetting book processing status...');
    book.isProcessed = false;
    book.processingStatus = 'processing';
    book.totalChunks = 0;
    book.embeddingsIndex = 'temp';
    await book.save();
    
    // Reprocess the book
    console.log('Reprocessing book...');
    const processingResult = await processBookUpload(pdfBuffer, book.title, book._id);
    
    // Update book with new processing results
    console.log('Updating book with processing results...');
    book.totalChunks = processingResult.totalChunks;
    book.isProcessed = true;
    book.processingStatus = 'completed';
    book.embeddingsIndex = `book_${book._id}`;
    await book.save();
    
    console.log(`✅ Book "${book.title}" embeddings fixed successfully!`);
    console.log(`New total chunks: ${book.totalChunks}`);
    
  } catch (error) {
    console.error(`❌ Error fixing embeddings for book ${bookId}:`, error);
  }
};

const listBooksWithEmbeddingIssues = async () => {
  try {
    console.log('\n=== Books with potential embedding issues ===');
    
    const books = await Book.find({
      isProcessed: true,
      processingStatus: 'completed'
    }).select('_id title subdomain totalChunks embeddingsIndex createdAt');
    
    if (books.length === 0) {
      console.log('No processed books found');
      return [];
    }
    
    console.log(`Found ${books.length} processed books:`);
    books.forEach(book => {
      console.log(`- ${book.title} (ID: ${book._id})`);
      console.log(`  Subdomain: ${book.subdomain}`);
      console.log(`  Total chunks: ${book.totalChunks}`);
      console.log(`  Embeddings index: ${book.embeddingsIndex}`);
      console.log(`  Created: ${book.createdAt}`);
      console.log('');
    });
    
    return books;
  } catch (error) {
    console.error('Error listing books:', error);
    return [];
  }
};

const main = async () => {
  try {
    await connectDB();
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('Usage: node fix-embeddings.js [bookId]');
      console.log('Or: node fix-embeddings.js --list');
      console.log('Or: node fix-embeddings.js --fix-all');
      
      const books = await listBooksWithEmbeddingIssues();
      if (books.length > 0) {
        console.log('\nTo fix a specific book, run:');
        console.log(`node fix-embeddings.js ${books[0]._id}`);
      }
      return;
    }
    
    if (args[0] === '--list') {
      await listBooksWithEmbeddingIssues();
      return;
    }
    
    if (args[0] === '--fix-all') {
      const books = await Book.find({
        isProcessed: true,
        processingStatus: 'completed'
      }).select('_id title');
      
      console.log(`\nFixing embeddings for ${books.length} books...`);
      
      for (const book of books) {
        await fixBookEmbeddings(book._id);
      }
      
      console.log('\n✅ All books processed!');
      return;
    }
    
    // Fix specific book
    const bookId = args[0];
    await fixBookEmbeddings(bookId);
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

main();
