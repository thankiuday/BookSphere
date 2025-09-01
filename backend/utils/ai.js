require('dotenv').config();
const { OpenAIEmbeddings } = require('@langchain/openai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { ChatOpenAI } = require('@langchain/openai');
const pdfParse = require('pdf-parse');

const { storeEmbeddings, loadEmbeddings } = require('./embeddingStorage');

// Lazy initialization of OpenAI clients
let openai = null;
let embeddings = null;

const initializeOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing. Set it in backend/.env to enable processing.');
  }
  
  console.log('OpenAI API key found, initializing clients...');
  
  if (!openai) {
    openai = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.7,
      maxTokens: 1000,
      modelName: 'gpt-3.5-turbo'
    });
    console.log('OpenAI client initialized');
  }
  
  if (!embeddings) {
    embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI Embeddings client initialized');
  }
  
  return { openai, embeddings };
};

// Process PDF and extract text
const processPDF = async (pdfBuffer) => {
  try {
    console.log('Starting PDF processing...');
    console.log('PDF buffer size:', pdfBuffer.length, 'bytes');
    
    const data = await pdfParse(pdfBuffer);
    if (process.env.NODE_ENV !== 'production') {
      console.log('PDF parsed successfully');
      console.log('Extracted text length:', data.text.length);
    }
    
    // Check if text is meaningful
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF contains no readable text');
    }
    
    if (data.text.trim().length < 50) {
      console.warn('Warning: PDF contains very little text:', data.text.trim());
    }
    
    return data.text;
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('Failed to process PDF file');
  }
};

// Split text into chunks for embeddings
const splitTextIntoChunks = async (text, chunkSize = 1000, chunkOverlap = 200) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Starting text chunking...');
      console.log('Input text length:', text.length);
    }
    
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', ' ', '']
    });

    const chunks = await splitter.splitText(text);
    console.log('Text split into chunks:', chunks.length);
    
    // Log details about each chunk (dev only)
    if (process.env.NODE_ENV !== 'production') {
      chunks.forEach((chunk, index) => {
        console.log(`Chunk ${index + 1}: ${chunk.length} chars`);
      });
    }
    
    return chunks;
  } catch (error) {
    console.error('Text splitting error:', error);
    throw new Error('Failed to split text into chunks');
  }
};

// Create embeddings for text chunks
const createEmbeddings = async (chunks) => {
  try {
    const { embeddings } = initializeOpenAI();
    const vectorStore = await MemoryVectorStore.fromTexts(
      chunks,
      chunks.map((_, i) => ({ id: i })),
      embeddings
    );
    
    return vectorStore;
  } catch (error) {
    console.error('Embeddings creation error:', error);
    throw new Error('Failed to create embeddings');
  }
};

// Search for relevant content in embeddings
const searchEmbeddings = async (bookId, query, k = 5) => {
  try {
    // Load embeddings for the book
    const vectorStore = await loadEmbeddings(bookId);
    if (!vectorStore) {
      console.log(`No embeddings found for book ${bookId}`);
      return [];
    }
    
    // For page-related questions, try to get more chunks to increase chances of finding relevant content
    let searchK = k;
    if (query.toLowerCase().includes('page') || query.toLowerCase().includes('chapter')) {
      searchK = Math.min(k * 3, 15); // Get even more chunks for page-related questions
      console.log(`Page-related query detected, increasing search to ${searchK} chunks`);
    }
    
    // For translation requests, also increase search to get more context
    if (query.toLowerCase().includes('translate') || query.toLowerCase().includes('in ') || 
        query.toLowerCase().includes('हिंदी') || query.toLowerCase().includes('español') ||
        query.toLowerCase().includes('français') || query.toLowerCase().includes('deutsch')) {
      searchK = Math.min(k * 2, 10); // Get more chunks for translation requests
      console.log(`Translation request detected, increasing search to ${searchK} chunks`);
    }
    
    // Try the original query first
    let results = await vectorStore.similaritySearch(query, searchK);
    console.log(`Initial search for "${query}" returned ${results.length} results`);
    
    // If no results and it's a page-specific query, try alternative search strategies
    if (results.length === 0 && (query.toLowerCase().includes('page') || /\b\d+\b/.test(query))) {
      console.log('No results for page query, trying alternative search strategies...');
      
      // Try searching for just the number
      const numberMatch = query.match(/\b(\d+)\b/);
      if (numberMatch) {
        const pageNumber = numberMatch[1];
        console.log(`Trying search with page number: ${pageNumber}`);
        results = await vectorStore.similaritySearch(pageNumber, searchK);
        console.log(`Search with page number returned ${results.length} results`);
      }
      
      // If still no results, try broader terms
      if (results.length === 0) {
        console.log('Trying broader search terms...');
        const broaderTerms = ['content', 'text', 'chapter', 'section', 'book'];
        for (const term of broaderTerms) {
          results = await vectorStore.similaritySearch(term, searchK);
          if (results.length > 0) {
            console.log(`Found ${results.length} results with term: ${term}`);
            break;
          }
        }
      }
    }
    
    // If still no results, try to get any content from the book
    if (results.length === 0) {
      console.log('No specific results found, trying to get any book content...');
      try {
        // Try to get all available documents (this might not work with MemoryVectorStore)
        // For now, try a very generic search
        results = await vectorStore.similaritySearch('book content', Math.min(searchK, 5));
        console.log(`Generic search returned ${results.length} results`);
      } catch (error) {
        console.log('Generic search also failed:', error.message);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Embeddings search error:', error);
    throw new Error('Failed to search embeddings');
  }
};

// Generate AI response based on context
const generateResponse = async (query, context, bookTitle) => {
  try {
    const { openai } = initializeOpenAI();
    
    // Prepare context text
    const contextText = context.map(doc => doc.pageContent).join('\n\n');
    
    // Check if this is a translation request
    const isTranslationRequest = query.toLowerCase().includes('translate') || 
                                query.toLowerCase().includes('in ') ||
                                query.toLowerCase().includes('हिंदी') ||
                                query.toLowerCase().includes('español') ||
                                query.toLowerCase().includes('français') ||
                                query.toLowerCase().includes('deutsch');
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Generating response for query:', query);
      console.log('Translation request detected:', isTranslationRequest);
      console.log('Context length:', contextText.length);
    }
    
    const systemPrompt = `You are an AI assistant for the book titled "${bookTitle}".

Your ONLY task is to answer questions strictly based on the book content provided below.  
You are NOT allowed to answer questions unrelated to this book.  

Guidelines:
- Always use ONLY the provided book content to answer questions.
- If the question is about the book, provide a clear, detailed, and helpful answer using the relevant parts of the text chunks.
- If the user asks about specific pages (like "page 33", "page number 33", "what's on page 33"), find and summarize the relevant content from the provided text chunks that corresponds to that page or section.
- If the user asks about specific chapters or sections, find and summarize the relevant content from the provided text chunks.
- For page-specific questions, look through the provided content and identify which parts might correspond to the requested page, then provide a summary of that content.
- If the question is not related to the book, respond with:  
  "I can only answer questions related to the book '${bookTitle}'. Please ask me something from the book."
- If there is not enough detail in the content to answer a specific page question, politely say:  
  "I don't have specific information about that page in the provided content. Please try asking about a different page or section of the book."
- NEVER use outside knowledge or make assumptions beyond the book content.
- Provide translations if explicitly requested, but still ensure answers come only from the book.
- Be concise, accurate, and stay fully grounded in the provided text.
- Answer confidently based on the provided content - do not add question marks or uncertainty markers.
- Provide direct, clear answers without hedging or uncertainty.

Book content:  
${contextText}`;

    console.log('Sending request to OpenAI...');
    const response = await openai.invoke([
      ['system', systemPrompt],
      ['human', query]
    ]);

    if (process.env.NODE_ENV !== 'production') {
      console.log('OpenAI response received');
    }
    
    // Handle LangChain ChatOpenAI response format
    let content;
    if (typeof response === 'string') {
      // LangChain ChatOpenAI returns a string directly
      content = response;
    } else if (response && response.content) {
      // Fallback for other formats
      if (Array.isArray(response.content)) {
        content = response.content[0]?.text || '';
      } else if (typeof response.content === 'string') {
        content = response.content;
      } else {
        content = response.content.toString();
      }
    } else if (response && response.text) {
      // Legacy format
      content = response.text;
    } else if (response && response.choices && response.choices.length > 0) {
      // Direct OpenAI API format (fallback)
      content = response.choices[0].message.content;
    } else {
      console.log('Full response object:', JSON.stringify(response, null, 2));
      content = response.toString();
    }
    
    // Clean up the content - remove any question marks that might be artifacts
    if (content && typeof content === 'string') {
      content = content.trim();
      // Remove leading/trailing question marks that might be artifacts
      content = content.replace(/^[?]+/, '').replace(/[?]+$/, '');
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Extracted content length:', content ? content.length : 0);
    }
    
    return content;
  } catch (error) {
    console.error('AI response generation error:', error);
    console.error('Error details:', error.message);
    throw new Error('Failed to generate AI response');
  }
};

// Check if query is relevant to book content
const isQueryRelevant = async (query, context) => {
  try {
    // If no context is found, the query is not relevant
    if (!context || context.length === 0) {
      console.log('No context found for query:', query);
      return false;
    }

    // Check if the context has meaningful content
    const hasContent = context.some(doc => 
      doc.pageContent && 
      doc.pageContent.trim().length > 10
    );

    if (!hasContent) {
      console.log('No meaningful content found in context for query:', query);
      return false;
    }

    // Check if this is a page-specific query
    const isPageQuery = query.toLowerCase().includes('page') || 
                       query.toLowerCase().includes('chapter') ||
                       /\b\d+\b/.test(query); // Contains numbers (could be page numbers)

    // Check if this is a book-related query (summary, explain, what is, etc.)
    const isBookQuery = query.toLowerCase().includes('summary') ||
                       query.toLowerCase().includes('explain') ||
                       query.toLowerCase().includes('what is') ||
                       query.toLowerCase().includes('what are') ||
                       query.toLowerCase().includes('tell me about') ||
                       query.toLowerCase().includes('describe') ||
                       query.toLowerCase().includes('translate') ||
                       query.toLowerCase().includes('in hindi') ||
                       query.toLowerCase().includes('in spanish') ||
                       query.toLowerCase().includes('in french') ||
                       query.toLowerCase().includes('in german');

    // If it's a page-specific or book-related query and we have context, it's relevant
    if ((isPageQuery || isBookQuery) && hasContent) {
      console.log('Query is relevant - page/book query with content:', query);
      return true;
    }

    // For other queries, check if the context actually contains relevant information
    // by looking for keyword matches in the context
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const contextText = context.map(doc => doc.pageContent.toLowerCase()).join(' ');
    
    const hasRelevantKeywords = queryWords.some(word => 
      contextText.includes(word)
    );

    if (hasRelevantKeywords) {
      console.log('Query is relevant - keyword match found:', query);
      return true;
    }

    // If we have substantial context and it's not clearly off-topic, allow it
    // This is more permissive to avoid false negatives
    const totalContextLength = context.reduce((sum, doc) => sum + (doc.pageContent?.length || 0), 0);
    if (totalContextLength > 100) { // If we have substantial context
      console.log('Query is relevant - substantial context available:', query);
      return true;
    }

    console.log('Query is not relevant - no clear relevance found:', query);
    return false;
  } catch (error) {
    console.error('Query relevance check error:', error);
    return false;
  }
};

// Process book upload: extract text, create embeddings, and store
const processBookUpload = async (pdfBuffer, bookTitle, bookId) => {
  try {
    console.log('Processing PDF for book:', bookTitle);
    
    // Extract text from PDF
    const text = await processPDF(pdfBuffer);
    console.log('PDF text extracted, length:', text.length);
    
    // Split text into chunks
    const chunks = await splitTextIntoChunks(text);
    console.log('Text split into chunks:', chunks.length);
    
    // Create embeddings
    console.log('Creating embeddings...');
    const { embeddings } = initializeOpenAI();
    
    console.log('Creating vector store with', chunks.length, 'chunks...');
    const vectorStore = await MemoryVectorStore.fromTexts(
      chunks,
      chunks.map((_, i) => ({ id: i })),
      embeddings
    );
    console.log('Vector store created successfully');
    
    // Test the vector store
    console.log('Testing vector store with a sample query...');
    const testResults = await vectorStore.similaritySearch('test', 1);
    console.log('Test search successful, found', testResults.length, 'results');
    
    // Store embeddings for later retrieval
    await storeEmbeddings(bookId, chunks, vectorStore);
    console.log('Embeddings created and stored successfully');
    
    return {
      text,
      chunks,
      vectorStore,
      totalChunks: chunks.length
    };
  } catch (error) {
    console.error('Book processing error:', error);
    // Preserve root cause in the error message for better diagnostics upstream
    throw new Error(`Failed to process book upload: ${error.message}`);
  }
};

module.exports = {
  processPDF,
  splitTextIntoChunks,
  createEmbeddings,
  searchEmbeddings,
  generateResponse,
  isQueryRelevant,
  processBookUpload
};
