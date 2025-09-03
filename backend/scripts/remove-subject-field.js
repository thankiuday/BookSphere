#!/usr/bin/env node

/**
 * Remove Subject Field Script
 * This script removes the subject field from all existing books in the database
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

// Remove subject field from all books
const removeSubjectField = async () => {
  try {
    console.log('🧹 Starting to remove subject field from all books...');
    
    // Update all books to unset the subject field
    const result = await Book.updateMany(
      {}, // Match all documents
      { $unset: { subject: "" } } // Remove the subject field
    );
    
    console.log(`✅ Successfully updated ${result.modifiedCount} books`);
    console.log(`📊 Total books processed: ${result.matchedCount}`);
    
    // Verify the field has been removed
    const booksWithSubject = await Book.find({ subject: { $exists: true } });
    if (booksWithSubject.length === 0) {
      console.log('✅ Subject field successfully removed from all books');
    } else {
      console.log(`⚠️  Warning: ${booksWithSubject.length} books still have subject field`);
    }
    
  } catch (error) {
    console.error('❌ Error removing subject field:', error.message);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting Subject Field Removal Script...');
    
    // Connect to database
    await connectDB();
    
    // Remove subject field
    await removeSubjectField();
    
    console.log('✅ Script completed successfully');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
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

module.exports = { main };
