#!/usr/bin/env node

/**
 * Train AI Relevance Checking with Global Book Questions
 * This script provides comprehensive examples of book-related questions
 * that people commonly ask around the world to train the AI better
 */

require('dotenv').config();
const { isQueryRelevant } = require('../utils/ai');

// Comprehensive list of book-related questions from around the world
const globalBookQuestions = [
  // === BOOK OVERVIEW & CONTENT ===
  {
    category: "Book Overview",
    questions: [
      "whats this book about ?",
      "What is this book about?",
      "Tell me about this book",
      "What does this book cover?",
      "What topics does this book discuss?",
      "What is the main subject of this book?",
      "What can I learn from this book?",
      "What's the book about?",
      "What's in this book?",
      "What does the book contain?"
    ]
  },

  // === BOOK QUALITY & READABILITY ===
  {
    category: "Book Quality & Readability",
    questions: [
      "book is good for read ?",
      "Is this book good to read?",
      "Is this book worth reading?",
      "Should I read this book?",
      "Is this book any good?",
      "How good is this book?",
      "Is this book worth my time?",
      "Would you recommend this book?",
      "Is this book helpful?",
      "Is this book useful?",
      "Is this book interesting?",
      "Is this book boring?",
      "Is this book easy to read?",
      "Is this book difficult?",
      "How hard is this book?",
      "Is this book suitable for beginners?",
      "Is this book for experts?",
      "Can a beginner read this book?",
      "Is this book too advanced?",
      "Is this book too basic?"
    ]
  },

  // === TARGET AUDIENCE ===
  {
    category: "Target Audience",
    questions: [
      "what are the target audience of this book",
      "Who is this book for?",
      "Who should read this book?",
      "Who is the target audience?",
      "Is this book for students?",
      "Is this book for professionals?",
      "Is this book for beginners?",
      "Is this book for experts?",
      "What age group is this book for?",
      "Is this book for children?",
      "Is this book for adults?",
      "Is this book for teenagers?",
      "Is this book for college students?",
      "Is this book for working professionals?",
      "Is this book for researchers?",
      "Is this book for teachers?",
      "Is this book for developers?",
      "Is this book for business people?",
      "Is this book for academics?",
      "Is this book for casual readers?"
    ]
  },

  // === BOOK SUMMARY & OVERVIEW ===
  {
    category: "Book Summary & Overview",
    questions: [
      "Can you summarize this book?",
      "What's the summary of this book?",
      "Give me a summary of this book",
      "What's the main idea of this book?",
      "What are the key points of this book?",
      "What are the main concepts in this book?",
      "What are the main themes of this book?",
      "What are the main arguments in this book?",
      "What's the central message of this book?",
      "What's the main takeaway from this book?",
      "What's the gist of this book?",
      "What's the essence of this book?",
      "What's the core of this book?",
      "What's the heart of this book?"
    ]
  },

  // === CHAPTER & SECTION SPECIFIC ===
  {
    category: "Chapter & Section Specific",
    questions: [
      "Explain the concepts in chapter 3",
      "What's in chapter 1?",
      "What does chapter 2 cover?",
      "Tell me about chapter 4",
      "What's the main topic of chapter 5?",
      "What are the key points in chapter 6?",
      "What's discussed in chapter 7?",
      "What's the focus of chapter 8?",
      "What's chapter 9 about?",
      "What's in the introduction?",
      "What's in the conclusion?",
      "What's in the preface?",
      "What's in the appendix?",
      "What's in the index?",
      "What's in the glossary?",
      "What's in the bibliography?",
      "What's in the references?"
    ]
  },

  // === BOOK COMPARISON & RECOMMENDATIONS ===
  {
    category: "Book Comparison & Recommendations",
    questions: [
      "How does this book compare to [other book]?",
      "Is this book better than [other book]?",
      "Which book should I read first?",
      "What's the difference between this book and [other book]?",
      "Is this book similar to [other book]?",
      "What other books are like this one?",
      "What books should I read after this?",
      "What books should I read before this?",
      "What's the best book on this topic?",
      "What are similar books to this one?",
      "What are alternative books to this one?",
      "What are the best books in this genre?",
      "What are the top books in this field?",
      "What are the must-read books on this subject?"
    ]
  },

  // === BOOK DIFFICULTY & PREREQUISITES ===
  {
    category: "Book Difficulty & Prerequisites",
    questions: [
      "How difficult is this book?",
      "Is this book easy to understand?",
      "Is this book hard to follow?",
      "What background knowledge do I need?",
      "What should I know before reading this book?",
      "Do I need to be an expert to read this?",
      "Can a beginner understand this book?",
      "Is this book too technical?",
      "Is this book too simple?",
      "What level is this book written for?",
      "Is this book for advanced readers?",
      "Is this book for intermediate readers?",
      "Is this book for novice readers?",
      "What skills do I need for this book?",
      "What experience do I need for this book?"
    ]
  },

  // === BOOK STRUCTURE & ORGANIZATION ===
  {
    category: "Book Structure & Organization",
    questions: [
      "How is this book organized?",
      "What's the structure of this book?",
      "How many chapters does this book have?",
      "What's the layout of this book?",
      "How is the content arranged?",
      "What's the format of this book?",
      "How is this book divided?",
      "What are the main sections?",
      "What are the parts of this book?",
      "How is the information presented?",
      "What's the organization of this book?",
      "How is the material structured?",
      "What's the framework of this book?"
    ]
  },

  // === BOOK USEFULNESS & APPLICATION ===
  {
    category: "Book Usefulness & Application",
    questions: [
      "How useful is this book?",
      "What can I do with this book?",
      "How practical is this book?",
      "Can I apply this book to my work?",
      "Can I use this book for my studies?",
      "Can I use this book for my research?",
      "Can I use this book for my project?",
      "Can I use this book for my business?",
      "Can I use this book for my career?",
      "Can I use this book for my personal development?",
      "How relevant is this book to my field?",
      "How applicable is this book to my situation?",
      "How helpful is this book for my needs?",
      "What value does this book provide?",
      "What benefits does this book offer?"
    ]
  },

  // === BOOK STYLE & WRITING ===
  {
    category: "Book Style & Writing",
    questions: [
      "How is this book written?",
      "What's the writing style like?",
      "Is this book well-written?",
      "Is the writing clear?",
      "Is the writing engaging?",
      "Is the writing boring?",
      "Is the writing interesting?",
      "Is the writing easy to follow?",
      "Is the writing hard to understand?",
      "What's the tone of this book?",
      "What's the voice of this book?",
      "How does the author write?",
      "What's the author's style?",
      "Is the author a good writer?",
      "Is the author clear in their writing?"
    ]
  },

  // === BOOK LENGTH & TIME ===
  {
    category: "Book Length & Time",
    questions: [
      "How long is this book?",
      "How many pages does this book have?",
      "How long does it take to read this book?",
      "Is this book short?",
      "Is this book long?",
      "Is this book too long?",
      "Is this book too short?",
      "How much time do I need for this book?",
      "Can I read this book quickly?",
      "Is this book a quick read?",
      "Is this book a slow read?",
      "How many hours to read this book?",
      "How many days to read this book?",
      "How many weeks to read this book?"
    ]
  },

  // === BOOK GENRE & CATEGORY ===
  {
    category: "Book Genre & Category",
    questions: [
      "What genre is this book?",
      "What type of book is this?",
      "What category does this book belong to?",
      "Is this a fiction book?",
      "Is this a non-fiction book?",
      "Is this a textbook?",
      "Is this a reference book?",
      "Is this a self-help book?",
      "Is this a business book?",
      "Is this a technical book?",
      "Is this an academic book?",
      "Is this a popular book?",
      "Is this a classic book?",
      "Is this a modern book?",
      "Is this a contemporary book?",
      "What kind of book is this?"
    ]
  },

  // === BOOK AUTHOR & CREDIBILITY ===
  {
    category: "Book Author & Credibility",
    questions: [
      "Who wrote this book?",
      "Who is the author?",
      "Is the author credible?",
      "Is the author an expert?",
      "What are the author's credentials?",
      "What's the author's background?",
      "What's the author's experience?",
      "Is the author qualified to write this?",
      "What does the author know about this topic?",
      "Is the author respected in this field?",
      "What are the author's qualifications?",
      "What are the author's achievements?",
      "What are the author's credentials?",
      "What's the author's reputation?",
      "Is the author well-known?",
      "Is the author famous?"
    ]
  },

  // === BOOK EDITION & VERSION ===
  {
    category: "Book Edition & Version",
    questions: [
      "What edition is this book?",
      "Is this the latest edition?",
      "Is this the first edition?",
      "How many editions are there?",
      "What's the difference between editions?",
      "Should I get the latest edition?",
      "Is the older edition still good?",
      "What version is this book?",
      "Is this the updated version?",
      "Is this the revised version?",
      "Is this the new version?",
      "Is this the old version?",
      "When was this book published?",
      "How old is this book?",
      "Is this book outdated?",
      "Is this book current?",
      "Is this book up-to-date?"
    ]
  },

  // === BOOK PRICE & VALUE ===
  {
    category: "Book Price & Value",
    questions: [
      "Is this book worth the price?",
      "Is this book expensive?",
      "Is this book cheap?",
      "Is this book affordable?",
      "Is this book overpriced?",
      "Is this book a good value?",
      "Is this book worth buying?",
      "Should I buy this book?",
      "Is this book worth the money?",
      "Is this book worth the investment?",
      "Is this book worth the cost?",
      "Is this book worth the expense?",
      "Is this book worth the price tag?",
      "Is this book worth the sticker price?",
      "Is this book worth the retail price?"
    ]
  },

  // === BOOK AVAILABILITY & ACCESS ===
  {
    category: "Book Availability & Access",
    questions: [
      "Where can I get this book?",
      "Where can I buy this book?",
      "Where can I find this book?",
      "Is this book available?",
      "Is this book in stock?",
      "Is this book out of print?",
      "Is this book rare?",
      "Is this book hard to find?",
      "Is this book easy to get?",
      "Can I borrow this book?",
      "Can I rent this book?",
      "Can I download this book?",
      "Is this book online?",
      "Is this book digital?",
      "Is this book physical?",
      "Is this book available as an ebook?",
      "Is this book available as an audiobook?"
    ]
  },

  // === BOOK REVIEWS & RATINGS ===
  {
    category: "Book Reviews & Ratings",
    questions: [
      "What do people say about this book?",
      "What are the reviews like?",
      "What are people saying about this book?",
      "What do critics say about this book?",
      "What do experts say about this book?",
      "What do readers think of this book?",
      "What's the rating of this book?",
      "How many stars does this book have?",
      "What's the average rating?",
      "What are the positive reviews?",
      "What are the negative reviews?",
      "What are the mixed reviews?",
      "What are the common complaints?",
      "What are the common praises?",
      "What are the strengths of this book?",
      "What are the weaknesses of this book?",
      "What are the pros and cons?"
    ]
  },

  // === BOOK CONTEXT & BACKGROUND ===
  {
    category: "Book Context & Background",
    questions: [
      "What's the context of this book?",
      "What's the background of this book?",
      "What's the history of this book?",
      "What's the origin of this book?",
      "What's the purpose of this book?",
      "What's the goal of this book?",
      "What's the aim of this book?",
      "What's the objective of this book?",
      "What's the mission of this book?",
      "What's the vision of this book?",
      "What's the philosophy of this book?",
      "What's the approach of this book?",
      "What's the methodology of this book?",
      "What's the framework of this book?",
      "What's the perspective of this book?",
      "What's the viewpoint of this book?",
      "What's the angle of this book?"
    ]
  },

  // === BOOK IMPACT & INFLUENCE ===
  {
    category: "Book Impact & Influence",
    questions: [
      "How influential is this book?",
      "How important is this book?",
      "How significant is this book?",
      "How groundbreaking is this book?",
      "How revolutionary is this book?",
      "How innovative is this book?",
      "How original is this book?",
      "How creative is this book?",
      "How unique is this book?",
      "How special is this book?",
      "How remarkable is this book?",
      "How extraordinary is this book?",
      "How exceptional is this book?",
      "How outstanding is this book?",
      "How excellent is this book?",
      "How superb is this book?",
      "How magnificent is this book?",
      "How wonderful is this book?"
    ]
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
const testAllQuestions = async () => {
  console.log('🧪 Training AI Relevance Checking with Global Book Questions\n');
  console.log(`📚 Total Categories: ${globalBookQuestions.length}`);
  
  let totalQuestions = 0;
  let relevantCount = 0;
  let notRelevantCount = 0;
  let failedCount = 0;
  
  for (let categoryIndex = 0; categoryIndex < globalBookQuestions.length; categoryIndex++) {
    const category = globalBookQuestions[categoryIndex];
    console.log(`\n📖 Category ${categoryIndex + 1}: ${category.category}`);
    console.log(`   Questions: ${category.questions.length}`);
    
    for (let questionIndex = 0; questionIndex < category.questions.length; questionIndex++) {
      const question = category.questions[questionIndex];
      totalQuestions++;
      
      try {
        const startTime = Date.now();
        const isRelevant = await isQueryRelevant(question, mockContext, "MERN Stack Course");
        const endTime = Date.now();
        
        if (isRelevant) {
          relevantCount++;
          console.log(`   ✅ "${question}" - RELEVANT (${endTime - startTime}ms)`);
        } else {
          notRelevantCount++;
          console.log(`   ❌ "${question}" - NOT_RELEVANT (${endTime - startTime}ms)`);
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failedCount++;
        console.log(`   💥 "${question}" - FAILED: ${error.message}`);
      }
    }
  }
  
  // Summary
  console.log('\n📊 TRAINING SUMMARY');
  console.log('==================');
  console.log(`Total Questions Tested: ${totalQuestions}`);
  console.log(`✅ Marked as RELEVANT: ${relevantCount}`);
  console.log(`❌ Marked as NOT_RELEVANT: ${notRelevantCount}`);
  console.log(`💥 Failed Tests: ${failedCount}`);
  console.log(`🎯 Success Rate: ${((relevantCount / totalQuestions) * 100).toFixed(1)}%`);
  
  if (relevantCount / totalQuestions > 0.9) {
    console.log('\n🎉 EXCELLENT! AI is well-trained for book-related questions!');
  } else if (relevantCount / totalQuestions > 0.8) {
    console.log('\n👍 GOOD! AI is mostly well-trained for book-related questions.');
  } else if (relevantCount / totalQuestions > 0.7) {
    console.log('\n⚠️  FAIR! AI needs more training for book-related questions.');
  } else {
    console.log('\n❌ POOR! AI needs significant training for book-related questions.');
  }
  
  console.log('\n🎯 Training completed!');
};

// Run training
if (require.main === module) {
  testAllQuestions().catch(console.error);
}

module.exports = { testAllQuestions, globalBookQuestions };
