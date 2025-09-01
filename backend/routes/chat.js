const express = require('express');
const { body, validationResult } = require('express-validator');
const Book = require('../models/Book');
const Chat = require('../models/Chat');
const { searchEmbeddings, generateResponse, isQueryRelevant } = require('../utils/ai');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Validation middleware
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('sessionId')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // Allow null/empty for new sessions
      }
      // Check if it's a valid UUID when provided
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('Session ID must be a valid UUID');
      }
      return true;
    })
    .withMessage('Session ID must be a valid UUID')
];

// @route   POST /api/chat
// @desc    Chat with book content
// @access  Public
router.post('/', validateChatMessage, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { message, sessionId, subdomain } = req.body;
    console.log('Chat request:', { message, sessionId, subdomain });

    // Get book by subdomain
    console.log('Looking for book with subdomain:', subdomain);
    const book = await Book.findOne({ subdomain });
    console.log('Book found:', book ? book.title : 'Not found');
    if (!book) {
      return res.status(404).json({
        error: 'Book not found',
        message: 'The requested book could not be found'
      });
    }
    
    // Check if book is processed
    console.log('Book processing status:', {
      isProcessed: book.isProcessed,
      processingStatus: book.processingStatus,
      totalChunks: book.totalChunks
    });
    
    if (!book.isProcessed) {
      return res.status(400).json({
        error: 'Book not ready',
        message: 'This book is still being processed. Please try again later.'
      });
    }

    // Create or get chat session
    console.log('Creating/getting chat session...');
    let chatSession;
    if (sessionId) {
      console.log('Looking for existing session:', sessionId);
      chatSession = await Chat.findOne({ sessionId, bookId: book._id });
      if (!chatSession) {
        return res.status(404).json({
          error: 'Chat session not found',
          message: 'Invalid session ID'
        });
      }
      console.log('Existing session found');
    } else {
      // Create new session
      console.log('Creating new chat session...');
      const newSessionId = uuidv4();
      chatSession = await Chat.createSession(
        book._id,
        newSessionId,
        req.headers['user-agent'],
        req.ip
      );
      console.log('New session created:', newSessionId);
    }

    // Add user message to chat
    console.log('Adding user message to chat...');
    try {
      await chatSession.addMessage('user', message);
      console.log('User message added');
    } catch (error) {
      console.error('Error adding user message:', error.message);
      return res.status(400).json({
        error: 'Invalid message',
        message: 'Message cannot be empty'
      });
    }

    // Search for relevant content in book embeddings
    console.log('Searching embeddings for book:', book._id);
    console.log('Book embeddings index:', book.embeddingsIndex);
    console.log('Book processing status:', book.processingStatus);
    console.log('Book total chunks:', book.totalChunks);
    
    const relevantContent = await searchEmbeddings(book._id, message, 5);
    console.log('Relevant content found:', relevantContent.length, 'chunks');
    
    // Debug: Log first chunk content if available
    if (relevantContent.length > 0) {
      console.log('First chunk preview:', relevantContent[0].pageContent.substring(0, 100) + '...');
    } else {
      console.log('No relevant content found. This could mean:');
      console.log('1. The book embeddings are not properly stored');
      console.log('2. The search query is not matching any content');
      console.log('3. The book processing is incomplete');
      console.log('Book processing status:', book.processingStatus);
      console.log('Book is processed:', book.isProcessed);
      console.log('Book total chunks:', book.totalChunks);
    }

    // Check if query is relevant to book content
    console.log('Checking query relevance...');
    const isRelevant = await isQueryRelevant(message, relevantContent);
    console.log('Query is relevant:', isRelevant);

    let aiResponse;
    let isRestricted = false;

    if (isRelevant && relevantContent.length > 0) {
      // Generate AI response based on book content
      console.log('Generating AI response...');
      try {
        console.log('Attempting to generate AI response...');
        console.log('Context length:', relevantContent.length);
        console.log('Query:', message);
        
        aiResponse = await generateResponse(message, relevantContent, book.title);
        console.log('AI response generated:', aiResponse ? 'Success' : 'Empty response');
        console.log('AI response length:', aiResponse ? aiResponse.length : 0);
        
        // Check if AI response is empty
        if (!aiResponse || aiResponse.trim().length === 0) {
          console.log('AI response is empty, using fallback');
          aiResponse = "I'm sorry, I couldn't generate a response for that question. Please try asking something else about the book.";
        }
      } catch (aiError) {
        console.error('AI response generation failed:', aiError.message);
        console.error('AI error stack:', aiError.stack);
        aiResponse = "I'm sorry, I encountered an error while processing your question. Please try again.";
      }
    } else {
      // Return restricted response with more helpful information
      console.log('Returning restricted response');
      
      // Check if the issue is no embeddings vs no relevant content
      if (relevantContent.length === 0) {
        aiResponse = "❌ I'm having trouble accessing the book content. This could be because:\n\n" +
                    "• The book is still being processed\n" +
                    "• The book content is not available\n" +
                    "• There was an issue with the book upload\n\n" +
                    "Please try again later or contact the book author if the problem persists.";
      } else {
        aiResponse = "❌ Sorry, this chat is restricted to the contents of this book. " +
                    "Please ask questions specifically related to the book content.";
      }
      isRestricted = true;
    }

    // Add AI response to chat
    try {
      await chatSession.addMessage('assistant', aiResponse, isRestricted);
    } catch (error) {
      console.error('Error adding AI response:', error.message);
      // Continue with the response even if saving fails
    }

    // Increment chat count for book
    await book.incrementChatCount();

    res.json({
      response: aiResponse,
      sessionId: chatSession.sessionId,
      isRestricted,
      book: {
        title: book.title,
        authorName: book.authorName,
        subdomain: book.subdomain
      },
      chatStats: {
        totalMessages: chatSession.totalMessages,
        restrictedMessages: chatSession.restrictedMessages
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({
      error: 'Chat failed',
      message: error.message || 'An error occurred while processing your message'
    });
  }
});

// @route   GET /api/chat/session/:sessionId
// @desc    Get chat session history
// @access  Public
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chatSession = await Chat.findOne({ sessionId })
      .populate('bookId', 'title authorName subdomain');

    if (!chatSession) {
      return res.status(404).json({
        error: 'Chat session not found',
        message: 'The requested chat session could not be found'
      });
    }

    res.json({
      session: {
        sessionId: chatSession.sessionId,
        messages: chatSession.messages,
        totalMessages: chatSession.totalMessages,
        restrictedMessages: chatSession.restrictedMessages,
        startedAt: chatSession.startedAt,
        lastActivity: chatSession.lastActivity,
        book: chatSession.bookId
      }
    });

  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({
      error: 'Failed to fetch chat session',
      message: 'An error occurred while fetching the chat session'
    });
  }
});

// @route   POST /api/chat/session/:sessionId/clear
// @desc    Clear chat session history
// @access  Public
router.post('/session/:sessionId/clear', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const chatSession = await Chat.findOne({ sessionId });
    if (!chatSession) {
      return res.status(404).json({
        error: 'Chat session not found',
        message: 'The requested chat session could not be found'
      });
    }

    // Clear messages but keep session
    chatSession.messages = [];
    chatSession.totalMessages = 0;
    chatSession.restrictedMessages = 0;
    await chatSession.save();

    res.json({
      message: 'Chat session cleared successfully',
      sessionId: chatSession.sessionId
    });

  } catch (error) {
    console.error('Clear chat session error:', error);
    res.status(500).json({
      error: 'Failed to clear chat session',
      message: 'An error occurred while clearing the chat session'
    });
  }
});

// @route   GET /api/chat/book/:subdomain/stats
// @desc    Get chat statistics for a book
// @access  Public
router.get('/book/:subdomain/stats', async (req, res) => {
  try {
    const { subdomain } = req.params;

    const book = await Book.findOne({ subdomain });
    if (!book) {
      return res.status(404).json({
        error: 'Book not found',
        message: 'The requested book could not be found'
      });
    }

    // Get chat statistics
    const chatStats = await Chat.aggregate([
      { $match: { bookId: book._id } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalMessages: { $sum: '$totalMessages' },
          totalRestrictedMessages: { $sum: '$restrictedMessages' },
          averageMessagesPerSession: { $avg: '$totalMessages' }
        }
      }
    ]);

    const stats = chatStats[0] || {
      totalSessions: 0,
      totalMessages: 0,
      totalRestrictedMessages: 0,
      averageMessagesPerSession: 0
    };

    res.json({
      book: {
        title: book.title,
        authorName: book.authorName,
        subdomain: book.subdomain,
        viewCount: book.viewCount,
        chatCount: book.chatCount
      },
      stats
    });

  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch chat statistics',
      message: 'An error occurred while fetching chat statistics'
    });
  }
});

// @route   GET /api/chat/test
// @desc    Test OpenAI API connection
// @access  Public
router.get('/test', async (req, res) => {
  try {
    const { searchEmbeddings, generateResponse } = require('../utils/ai');
    
    // Test with a simple query
    const testResponse = await generateResponse(
      'Hello, this is a test',
      [{ pageContent: 'This is a test document for AI response testing.' }],
      'Test Book'
    );
    
    res.json({
      success: true,
      message: 'OpenAI API is working!',
      testResponse
    });
  } catch (error) {
    console.error('OpenAI test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'OpenAI API test failed'
    });
  }
});

// @route   POST /api/chat/book/:subdomain/feedback
// @desc    Submit feedback for chat responses
// @access  Public
router.post('/book/:subdomain/feedback', [
  body('sessionId')
    .isUUID()
    .withMessage('Session ID must be a valid UUID'),
  body('messageIndex')
    .isInt({ min: 0 })
    .withMessage('Message index must be a non-negative integer'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Feedback cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { subdomain } = req.params;
    const { sessionId, messageIndex, rating, feedback } = req.body;

    // Verify book exists
    const book = await Book.findOne({ subdomain });
    if (!book) {
      return res.status(404).json({
        error: 'Book not found',
        message: 'The requested book could not be found'
      });
    }

    // Verify chat session exists
    const chatSession = await Chat.findOne({ sessionId, bookId: book._id });
    if (!chatSession) {
      return res.status(404).json({
        error: 'Chat session not found',
        message: 'Invalid session ID'
      });
    }

    // Verify message index is valid
    if (messageIndex >= chatSession.messages.length) {
      return res.status(400).json({
        error: 'Invalid message index',
        message: 'Message index is out of range'
      });
    }

    // In a real implementation, you would store feedback in a separate collection
    // For now, we'll just acknowledge the feedback
    res.json({
      message: 'Feedback submitted successfully',
      sessionId,
      messageIndex,
      rating
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      error: 'Failed to submit feedback',
      message: 'An error occurred while submitting feedback'
    });
  }
});

module.exports = router;
