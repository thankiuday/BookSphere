#!/usr/bin/env node

/**
 * Test Chat Flow
 * This script exactly mimics the chat route flow to identify where the issue occurs
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');
const { isQueryRelevant, searchEmbeddings, generateResponse } = require('../utils/ai');

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

// Test the exact chat flow
const testChatFlow = async (subdomain, message) => {
  try {
    console.log(`🧪 Testing chat flow for: "${message}"`);
    console.log(`📚 Book subdomain: ${subdomain}\n`);
    
    // Step 1: Find the book (like chat route does)
    console.log('🔍 STEP 1: Finding Book');
    console.log('========================');
    const book = await Book.findOne({ subdomain });
    if (!book) {
      console.log('❌ Book not found with that subdomain');
      return;
    }
    
    console.log(`✅ Book found: ${book.title} by ${book.authorName}`);
    console.log(`   ID: ${book._id}`);
    console.log(`   Processed: ${book.isProcessed}`);
    console.log(`   Status: ${book.processingStatus}`);
    console.log(`   Chunks: ${book.totalChunks}\n`);
    
    // Step 2: Search embeddings (exactly like chat route)
    console.log('🔍 STEP 2: Searching Embeddings');
    console.log('================================');
    console.log(`Searching embeddings for book: ${book._id}`);
    console.log(`Book embeddings index: ${book.embeddingsIndex}`);
    console.log(`Book processing status: ${book.processingStatus}`);
    console.log(`Book total chunks: ${book.totalChunks}`);
    
    let relevantContent = [];
    try {
      relevantContent = await searchEmbeddings(book._id, message, 5);
      console.log(`✅ Relevant content found: ${relevantContent.length} chunks`);
      
      // Debug: Log first chunk content if available
      if (relevantContent.length > 0) {
        console.log('First chunk preview:', relevantContent[0].pageContent.substring(0, 100) + '...');
      }
    } catch (embeddingError) {
      console.error('❌ Embedding search failed:', embeddingError.message);
      console.log('No relevant content found. This could mean:');
      console.log('1. The book embeddings are not properly stored');
      console.log('2. The search query is not matching any content');
      console.log('3. The book processing is incomplete');
      console.log(`Book processing status: ${book.processingStatus}`);
      console.log(`Book is processed: ${book.isProcessed}`);
      console.log(`Book total chunks: ${book.totalChunks}`);
      
      // Set relevantContent to empty array to continue processing
      relevantContent = [];
    }
    
    // Step 3: Check query relevance (exactly like chat route)
    console.log('\n🤖 STEP 3: Checking Query Relevance');
    console.log('====================================');
    console.log('Checking query relevance...');
    const isRelevant = await isQueryRelevant(message, relevantContent, book.title);
    console.log(`✅ Query is relevant: ${isRelevant}`);
    
    // Step 4: Decision logic (exactly like chat route)
    console.log('\n🎯 STEP 4: Decision Logic');
    console.log('==========================');
    console.log(`isRelevant: ${isRelevant}`);
    console.log(`relevantContent.length: ${relevantContent.length}`);
    console.log(`Condition: isRelevant && relevantContent.length > 0`);
    console.log(`Result: ${isRelevant && relevantContent.length > 0}`);
    
    let aiResponse;
    let isRestricted = false;
    
    if (isRelevant && relevantContent.length > 0) {
      // Generate AI response based on book content
      console.log('\n✨ STEP 5A: Generating AI Response');
      console.log('==================================');
      console.log('Generating AI response...');
      try {
        console.log('Attempting to generate AI response...');
        console.log('Context length:', relevantContent.length);
        console.log('Query:', message);
        
        aiResponse = await generateResponse(message, relevantContent, book.title);
        console.log('AI response generated:', aiResponse ? 'Success' : 'Empty response');
        console.log('AI response length:', aiResponse ? aiResponse.length : 0);
        
        if (aiResponse && aiResponse.trim().length > 0) {
          console.log('✅ AI response generated successfully!');
          console.log('Response preview:', aiResponse.substring(0, 200) + '...');
        } else {
          console.log('❌ AI response is empty');
        }
      } catch (aiError) {
        console.error('❌ AI response generation failed:', aiError.message);
        aiResponse = "I'm sorry, I encountered an error while processing your question. Please try again.";
      }
    } else {
      // Return restricted response with more helpful information
      console.log('\n🚫 STEP 5B: Returning Restricted Response');
      console.log('==========================================');
      console.log('Returning restricted response');
      
      // Check if the issue is no embeddings vs no relevant content
      if (relevantContent.length === 0) {
        aiResponse = "❌ I'm having trouble accessing the book content. This could be because:\n\n" +
                    "• The book is still being processed\n" +
                    "• The book content is not available\n" +
                    "• There was an issue with the book upload\n\n" +
                    "Please try again later or contact the book author if the problem persists.";
        console.log('❌ Issue: relevantContent.length === 0');
      } else {
        aiResponse = "❌ Sorry, this chat is restricted to the contents of this book. " +
                    "Please ask questions specifically related to the book content.";
        console.log('❌ Issue: Query marked as not relevant');
      }
      isRestricted = true;
    }
    
    // Final summary
    console.log('\n📊 FINAL SUMMARY');
    console.log('=================');
    console.log(`Query: "${message}"`);
    console.log(`Book: ${book.title}`);
    console.log(`Embeddings found: ${relevantContent.length} chunks`);
    console.log(`Query relevant: ${isRelevant}`);
    console.log(`Response type: ${isRestricted ? 'Restricted' : 'AI Generated'}`);
    console.log(`Response length: ${aiResponse ? aiResponse.length : 0} characters`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error stack:', error.stack);
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting Chat Flow Test...\n');
    
    // Connect to database
    await connectDB();
    
    // Get subdomain and message from command line arguments
    const subdomain = process.argv[2];
    const message = process.argv[3];
    
    if (!subdomain || !message) {
      console.log('❌ Please provide both subdomain and message as arguments');
      console.log('Usage: node scripts/test-chat-flow.js <subdomain> "<message>"');
      console.log('\nExample: node scripts/test-chat-flow.js bharanidheeraj-mernstackcourse "who is the author of this book"');
      process.exit(1);
    }
    
    // Test the chat flow
    await testChatFlow(subdomain, message);
    
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

module.exports = { testChatFlow };
