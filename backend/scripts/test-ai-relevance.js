#!/usr/bin/env node

/**
 * Test AI-Powered Query Relevance Checking
 * This script tests the new AI-based relevance determination
 */

require('dotenv').config();
const { isQueryRelevant } = require('../utils/ai');

// Test cases
const testCases = [
  {
    query: "whats this book about ?",
    description: "Book overview question",
    expected: "RELEVANT"
  },
  {
    query: "What is MERN stack?",
    description: "Technical content question",
    expected: "RELEVANT"
  },
  {
    query: "What's the weather like today?",
    description: "Unrelated external question",
    expected: "NOT_RELEVANT"
  },
  {
    query: "Can you help me with my homework?",
    description: "Personal request question",
    expected: "NOT_RELEVANT"
  },
  {
    query: "Explain the concepts in chapter 3",
    description: "Chapter-specific question",
    expected: "RELEVANT"
  },
  {
    query: "What's your favorite color?",
    description: "Personal opinion question",
    expected: "NOT_RELEVANT"
  },
  {
    query: "what are the target audience of this book",
    description: "Book target audience question",
    expected: "RELEVANT"
  },
  {
    query: "book is good for read ?",
    description: "Book quality/readability question",
    expected: "RELEVANT"
  },
  {
    query: "Is this book worth reading?",
    description: "Book worth reading question",
    expected: "RELEVANT"
  }
];

// Mock context for testing
const mockContext = [
  {
    pageContent: "MERN Stack is a popular JavaScript stack for building web applications. It consists of MongoDB, Express.js, React, and Node.js. This course covers all aspects of the MERN stack from basic concepts to advanced implementation."
  },
  {
    pageContent: "Chapter 1 introduces the fundamentals of web development and JavaScript. We'll cover variables, functions, and basic programming concepts that are essential for understanding the MERN stack."
  },
  {
    pageContent: "Chapter 3 focuses on React components and state management. You'll learn about functional components, hooks, and how to manage application state effectively."
  }
];

// Test function
const testRelevance = async () => {
  console.log('🧪 Testing AI-Powered Query Relevance Checking\n');
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n--- Test ${i + 1}: ${testCase.description} ---`);
    console.log(`Query: "${testCase.query}"`);
    console.log(`Expected: ${testCase.expected}`);
    
    try {
      const startTime = Date.now();
      const isRelevant = await isQueryRelevant(testCase.query, mockContext, "MERN Stack Course");
      const endTime = Date.now();
      
      console.log(`🤖 AI Response: ${isRelevant ? 'RELEVANT' : 'NOT_RELEVANT'}`);
      console.log(`⏱️  Response time: ${endTime - startTime}ms`);
      console.log(`✅ Test ${isRelevant === (testCase.expected === 'RELEVANT') ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Testing completed!');
};

// Run tests
if (require.main === module) {
  testRelevance().catch(console.error);
}

module.exports = { testRelevance };
