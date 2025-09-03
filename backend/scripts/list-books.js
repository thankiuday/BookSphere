#!/usr/bin/env node

/**
 * List All Books
 * This script lists all books in the database to help identify subdomains
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

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

// List all books
const listBooks = async () => {
  try {
    console.log('📚 Listing all books in database...\n');
    
    const books = await Book.find({}).select('title authorName subdomain isProcessed processingStatus totalChunks createdAt');
    
    if (books.length === 0) {
      console.log('❌ No books found in database');
      return;
    }
    
    console.log(`Found ${books.length} book(s):\n`);
    
    books.forEach((book, index) => {
      console.log(`${index + 1}. 📖 ${book.title}`);
      console.log(`   👤 Author: ${book.authorName}`);
      console.log(`   🔗 Subdomain: ${book.subdomain}`);
      console.log(`   ✅ Processed: ${book.isProcessed}`);
      console.log(`   ⚙️  Status: ${book.processingStatus}`);
      console.log(`   📄 Chunks: ${book.totalChunks}`);
      console.log(`   📅 Created: ${book.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
    console.log('💡 To diagnose a specific book, run:');
    console.log('   node scripts/diagnose-book-access.js <subdomain>');
    console.log('');
    console.log('Example:');
    console.log('   node scripts/diagnose-book-access.js mern-stack-course');
    
  } catch (error) {
    console.error('❌ Failed to list books:', error.message);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await listBooks();
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { listBooks };
