#!/usr/bin/env node

/**
 * Test Specific Query
 * This script tests a specific query to see where it fails in the process
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const { isQueryRelevant, searchEmbeddings } = require('../utils/ai');
const { loadEmbeddings } = require('../utils/embeddingStorage');

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

// Test specific query
const testQuery = async (subdomain, query) => {
  try {
    console.log(`🧪 Testing query: "${query}"`);
    console.log(`📚 Book subdomain: ${subdomain}\n`);
    
    // Find the book
    const book = await Book.findOne({ subdomain });
    if (!book) {
      console.log('❌ Book not found with that subdomain');
      return;
    }
    
    console.log('📖 Book found:');
    console.log(`   Title: ${book.title}`);
    console.log(`   Author: ${book.authorName}`);
    console.log(`   ID: ${book._id}`);
    console.log(`   Processed: ${book.isProcessed}`);
    console.log(`   Status: ${book.processingStatus}`);
    console.log(`   Chunks: ${book.totalChunks}\n`);
    
    // Step 1: Test embedding search
    console.log('🔍 STEP 1: Testing Embedding Search');
    console.log('====================================');
    try {
      const relevantContent = await searchEmbeddings(book._id, query, 5);
      console.log(`✅ Search successful: ${relevantContent.length} chunks found`);
      
      if (relevantContent.length > 0) {
        console.log('First chunk preview:');
        console.log(relevantContent[0].pageContent.substring(0, 200) + '...\n');
        
        // Step 2: Test relevance checking
        console.log('🤖 STEP 2: Testing Relevance Check');
        console.log('==================================');
        try {
          const isRelevant = await isQueryRelevant(query, relevantContent, book.title);
          console.log(`✅ Relevance check successful: ${isRelevant ? 'RELEVANT' : 'NOT_RELEVANT'}`);
          
          if (isRelevant) {
            console.log('🎉 Query should work in chat!');
          } else {
            console.log('❌ Query marked as not relevant - this is the issue!');
          }
        } catch (relevanceError) {
          console.error('❌ Relevance check failed:', relevanceError.message);
        }
      } else {
        console.log('❌ No content found - this is the issue!');
      }
    } catch (searchError) {
      console.error('❌ Search failed:', searchError.message);
      console.error('Error stack:', searchError.stack);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting Specific Query Test...\n');
    
    // Connect to database
    await connectDB();
    
    // Get subdomain and query from command line arguments
    const subdomain = process.argv[2];
    const query = process.argv[3];
    
    if (!subdomain || !query) {
      console.log('❌ Please provide both subdomain and query as arguments');
      console.log('Usage: node scripts/test-specific-query.js <subdomain> "<query>"');
      console.log('\nExample: node scripts/test-specific-query.js bharanidheeraj-mernstackcourse "who is the author of this book"');
      process.exit(1);
    }
    
    // Test the query
    await testQuery(subdomain, query);
    
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

module.exports = { testQuery };
