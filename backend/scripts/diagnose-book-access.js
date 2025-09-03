#!/usr/bin/env node

/**
 * Diagnose Book Access Issues
 * This script helps identify why book content access is failing in chat
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const { embeddingsExist, loadEmbeddings } = require('../utils/embeddingStorage');
const { searchEmbeddings } = require('../utils/ai');

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

// Check book status and embeddings
const diagnoseBook = async (subdomain) => {
  try {
    console.log(`🔍 Diagnosing book with subdomain: ${subdomain}`);
    
    // Find the book
    const book = await Book.findOne({ subdomain });
    if (!book) {
      console.log('❌ Book not found with that subdomain');
      return;
    }
    
    console.log('\n📚 BOOK INFORMATION:');
    console.log('==================');
    console.log(`ID: ${book._id}`);
    console.log(`Title: ${book.title}`);
    console.log(`Author: ${book.authorName}`);
    console.log(`Subdomain: ${book.subdomain}`);
    console.log(`File URL: ${book.fileUrl}`);
    console.log(`Is Processed: ${book.isProcessed}`);
    console.log(`Processing Status: ${book.processingStatus}`);
    console.log(`Total Chunks: ${book.totalChunks}`);
    console.log(`Embeddings Index: ${book.embeddingsIndex}`);
    console.log(`Created: ${book.createdAt}`);
    console.log(`Updated: ${book.updatedAt}`);
    
    // Check if embeddings exist
    console.log('\n🔍 EMBEDDINGS STATUS:');
    console.log('=====================');
    const embeddingsExistResult = await embeddingsExist(book._id);
    console.log(`Embeddings exist: ${embeddingsExistResult}`);
    
    if (embeddingsExistResult) {
      console.log('✅ Embeddings file found');
      
      // Try to load embeddings
      try {
        const vectorStore = await loadEmbeddings(book._id);
        if (vectorStore) {
          console.log('✅ Embeddings loaded successfully');
          
          // Try a test search
          console.log('\n🧪 TESTING EMBEDDING SEARCH:');
          console.log('============================');
          
          const testQuery = "What is this book about?";
          console.log(`Test query: "${testQuery}"`);
          
          try {
            const results = await searchEmbeddings(book._id, testQuery, 3);
            console.log(`Search results: ${results.length} chunks found`);
            
            if (results.length > 0) {
              console.log('✅ Search is working!');
              console.log('First result preview:');
              console.log(results[0].pageContent.substring(0, 200) + '...');
            } else {
              console.log('❌ Search returned no results');
            }
          } catch (searchError) {
            console.error('❌ Search failed:', searchError.message);
          }
        } else {
          console.log('❌ Failed to load embeddings');
        }
      } catch (loadError) {
        console.error('❌ Error loading embeddings:', loadError.message);
      }
    } else {
      console.log('❌ No embeddings file found');
      console.log('This means the book was never processed or processing failed');
    }
    
    // Check book processing
    console.log('\n⚙️  BOOK PROCESSING STATUS:');
    console.log('==========================');
    if (book.isProcessed) {
      console.log('✅ Book is marked as processed');
    } else {
      console.log('❌ Book is NOT marked as processed');
    }
    
    if (book.processingStatus === 'completed') {
      console.log('✅ Processing status is completed');
    } else {
      console.log(`❌ Processing status: ${book.processingStatus}`);
    }
    
    if (book.totalChunks > 0) {
      console.log(`✅ Book has ${book.totalChunks} chunks`);
    } else {
      console.log('❌ Book has no chunks');
    }
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    
    if (!embeddingsExistResult) {
      console.log('1. 🔄 Re-process the book to generate embeddings');
      console.log('   Run: node scripts/regenerate-embeddings-complete.js');
    }
    
    if (!book.isProcessed || book.processingStatus !== 'completed') {
      console.log('2. ⚙️  Check book processing status');
      console.log('   The book may need to be re-processed');
    }
    
    if (book.totalChunks === 0) {
      console.log('3. 📄 Book has no content chunks');
      console.log('   This suggests the PDF processing failed');
    }
    
    if (embeddingsExistResult && book.isProcessed && book.processingStatus === 'completed' && book.totalChunks > 0) {
      console.log('✅ Book appears to be properly configured');
      console.log('The issue might be in the chat route or embedding search logic');
    }
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.error('Error stack:', error.stack);
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting Book Access Diagnosis...\n');
    
    // Connect to database
    await connectDB();
    
    // Get subdomain from command line argument
    const subdomain = process.argv[2];
    if (!subdomain) {
      console.log('❌ Please provide a book subdomain as an argument');
      console.log('Usage: node scripts/diagnose-book-access.js <subdomain>');
      console.log('\nExample: node scripts/diagnose-book-access.js mern-stack-course');
      process.exit(1);
    }
    
    // Diagnose the book
    await diagnoseBook(subdomain);
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Database connection closed');
    }
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { diagnoseBook };
