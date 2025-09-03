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
- If the user asks about specific pages (like "page 33", "page number 33", "what's on page 33","content on page 33","content of page 33",page no 33), find and summarize the relevant content from the provided text chunks that corresponds to that page or section.
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

// Check if a query is relevant to the book content using AI
const isQueryRelevant = async (query, context, bookTitle) => {
  try {
    // If no context, query can't be relevant
    if (!context || context.length === 0) {
      console.log('No context found for query:', query);
      return false;
    }

    // If we have substantial context, let AI decide relevance
    const { openai } = initializeOpenAI();
    
    // Prepare context text for AI analysis
    const contextText = context.map(doc => doc.pageContent).join('\n\n');
    
    // Create a prompt for AI to analyze query relevance
    const relevancePrompt = `You are an AI assistant analyzing whether a user's question is relevant to a specific book.

Book Title: "${bookTitle}"

Available Book Content (first 2000 characters):
${contextText.substring(0, 2000)}${contextText.length > 2000 ? '...' : ''}

User Question: "${query}"

Task: Determine if this question is relevant to the book content above.

IMPORTANT: Be PERMISSIVE and allow questions that are related to the book in any way.

Consider these questions as RELEVANT (examples from global book culture):

📚 BOOK OVERVIEW & CONTENT:
- "What's this book about?", "Tell me about this book", "What does this book cover?"
- "What topics does this book discuss?", "What can I learn from this book?"

📖 BOOK QUALITY & READABILITY:
- "Is this book good to read?", "Is this book worth reading?", "Should I read this book?"
- "Is this book helpful?", "Is this book useful?", "Is this book interesting?"
- "Is this book easy to read?", "Is this book difficult?", "How hard is this book?"
- "Is this book suitable for beginners?", "Is this book for experts?"

👥 TARGET AUDIENCE:
- "Who is this book for?", "Who should read this book?", "What age group is this book for?"
- "Is this book for students?", "Is this book for professionals?", "Is this book for beginners?"

📋 BOOK SUMMARY & OVERVIEW:
- "Can you summarize this book?", "What's the main idea?", "What are the key points?"
- "What are the main concepts?", "What are the main themes?", "What's the central message?"

📑 CHAPTER & SECTION SPECIFIC:
- "What's in chapter X?", "Explain the concepts in chapter X", "What does chapter X cover?"
- "What's in the introduction?", "What's in the conclusion?", "What's in the appendix?"

🔄 BOOK COMPARISON & RECOMMENDATIONS:
- "How does this book compare to others?", "Which book should I read first?"
- "What other books are like this one?", "What books should I read after this?"

📊 BOOK DIFFICULTY & PREREQUISITES:
- "How difficult is this book?", "What background knowledge do I need?"
- "What should I know before reading?", "Can a beginner understand this book?"

🏗️ BOOK STRUCTURE & ORGANIZATION:
- "How is this book organized?", "What's the structure?", "How many chapters does it have?"
- "What's the layout?", "How is the content arranged?"

💡 BOOK USEFULNESS & APPLICATION:
- "How useful is this book?", "What can I do with this book?", "How practical is this book?"
- "Can I apply this to my work?", "Can I use this for my studies?", "Can I use this for my research?"

✍️ BOOK STYLE & WRITING:
- "How is this book written?", "What's the writing style like?", "Is this book well-written?"
- "Is the writing clear?", "Is the writing engaging?", "What's the tone of this book?"

⏱️ BOOK LENGTH & TIME:
- "How long is this book?", "How many pages?", "How long does it take to read?"
- "Is this book short?", "Is this book long?", "How much time do I need?"

📚 BOOK GENRE & CATEGORY:
- "What genre is this book?", "What type of book is this?", "What category does it belong to?"
- "Is this fiction?", "Is this non-fiction?", "Is this a textbook?", "Is this a reference book?"

✍️ BOOK AUTHOR & CREDIBILITY:
- "Who wrote this book?", "Who is the author?", "Is the author credible?"
- "Is the author an expert?", "What are the author's credentials?"

📖 BOOK EDITION & VERSION:
- "What edition is this book?", "Is this the latest edition?", "When was this published?"
- "How old is this book?", "Is this book outdated?", "Is this book current?"

💰 BOOK PRICE & VALUE:
- "Is this book worth the price?", "Is this book expensive?", "Is this book affordable?"
- "Is this book worth buying?", "Should I buy this book?", "Is this book a good value?"

🛒 BOOK AVAILABILITY & ACCESS:
- "Where can I get this book?", "Where can I buy this book?", "Is this book available?"
- "Is this book in stock?", "Can I borrow this book?", "Is this book online?"

⭐ BOOK REVIEWS & RATINGS:
- "What do people say about this book?", "What are the reviews like?", "What's the rating?"
- "How many stars does it have?", "What do critics say?", "What do experts say?"

🌍 BOOK CONTEXT & BACKGROUND:
- "What's the context of this book?", "What's the background?", "What's the purpose?"
- "What's the goal?", "What's the mission?", "What's the philosophy?"

🚀 BOOK IMPACT & INFLUENCE:
- "How influential is this book?", "How important is this book?", "How significant is this book?"
- "How groundbreaking is this book?", "How revolutionary is this book?"

🔑 KEYWORDS THAT MAKE QUESTIONS RELEVANT:
Any question containing: book, read, good, worth, content, summary, about, what, how, why, topic, theme, chapter, section, page, author, writing, quality, suitable, appropriate, recommend, compare, opinion, review, audience, target, who, for, level, difficulty, beginner, expert, student, professional, useful, helpful, practical, apply, use, structure, organization, format, style, tone, voice, length, time, pages, genre, category, type, edition, version, publish, price, value, buy, buy, available, access, stock, borrow, rent, download, online, digital, physical, review, rating, stars, critic, expert, reader, context, background, purpose, goal, mission, philosophy, approach, methodology, framework, perspective, viewpoint, angle, impact, influence, important, significant, groundbreaking, revolutionary, innovative, original, creative, unique, special, remarkable, extraordinary, exceptional, outstanding, excellent, superb, magnificent, wonderful

ONLY mark as NOT_RELEVANT if the question is completely unrelated to books, reading, or learning (e.g., "What's the weather like?", "How to cook pasta?", "What's your favorite color?")

Respond with ONLY "RELEVANT" or "NOT_RELEVANT" followed by a brief explanation.

Example responses:
- "RELEVANT - Question asks about book content and quality"
- "RELEVANT - Question asks if book is worth reading"
- "RELEVANT - Question asks for book summary or overview"
- "RELEVANT - Question asks about target audience"
- "NOT_RELEVANT - Question is about cooking, not books"`;

    console.log('🤖 Using AI to determine query relevance...');
    console.log('📝 Query being analyzed:', query);
    console.log('📚 Book title:', bookTitle);
    
    // Get AI response using correct LangChain syntax
    const response = await openai.invoke([
      ['system', 'You are a helpful AI assistant that determines query relevance. Respond with ONLY "RELEVANT" or "NOT_RELEVANT" followed by a brief explanation.'],
      ['human', relevancePrompt]
    ]);

    // Handle LangChain response format
    let aiResponse;
    if (typeof response === 'string') {
      aiResponse = response;
    } else if (response && response.content) {
      aiResponse = response.content;
    } else {
      aiResponse = response.toString();
    }

    aiResponse = aiResponse.trim();
    console.log('🤖 AI relevance response:', aiResponse);

    // Parse AI response
    const isRelevant = aiResponse.toUpperCase().startsWith('RELEVANT');
    
    if (isRelevant) {
      console.log('✅ AI determined query is RELEVANT to book content');
    } else {
      console.log('❌ AI determined query is NOT RELEVANT to book content');
    }
    
    return isRelevant;
    
  } catch (error) {
    console.error('AI relevance check error:', error);
    
    // Fallback to basic relevance check if AI fails
    console.log('🔄 AI relevance check failed, using fallback logic...');
    
    // Check if the context has meaningful content
    const hasContent = context.some(doc => 
      doc.pageContent && 
      doc.pageContent.trim().length > 10
    );

    if (!hasContent) {
      console.log('No meaningful content found in context for query:', query);
      return false;
    }

    // Basic fallback: be more permissive - if we have any meaningful content, allow book-related queries
    const totalContextLength = context.reduce((sum, doc) => sum + (doc.pageContent?.length || 0), 0);
    
    // Check if the query contains book-related keywords (comprehensive list from global training)
    const bookRelatedKeywords = [
      // Core book terms
      'book', 'read', 'reading', 'reader', 'text', 'content', 'material', 'publication',
      
      // Quality & value
      'good', 'worth', 'quality', 'value', 'helpful', 'useful', 'practical', 'interesting',
      'boring', 'easy', 'difficult', 'hard', 'suitable', 'appropriate', 'recommend',
      
      // Content & structure
      'about', 'what', 'how', 'why', 'topic', 'theme', 'subject', 'concept', 'idea',
      'chapter', 'section', 'page', 'part', 'introduction', 'conclusion', 'preface',
      'appendix', 'index', 'glossary', 'bibliography', 'reference',
      
      // Summary & overview
      'summary', 'overview', 'gist', 'essence', 'core', 'heart', 'main', 'key', 'central',
      'message', 'takeaway', 'point', 'argument', 'theme',
      
      // Author & credibility
      'author', 'writer', 'written', 'writing', 'style', 'tone', 'voice', 'clear',
      'engaging', 'well-written', 'credible', 'expert', 'qualified', 'background',
      'experience', 'credentials', 'reputation', 'famous', 'well-known',
      
      // Target audience
      'audience', 'target', 'who', 'for', 'level', 'difficulty', 'beginner', 'expert',
      'student', 'professional', 'academic', 'casual', 'children', 'teenager', 'adult',
      'college', 'researcher', 'teacher', 'developer', 'business', 'academic',
      
      // Comparison & recommendations
      'compare', 'similar', 'different', 'better', 'best', 'alternative', 'other',
      'recommend', 'suggestion', 'choice', 'option', 'first', 'after', 'before',
      
      // Structure & organization
      'structure', 'organization', 'layout', 'format', 'arrangement', 'division',
      'framework', 'methodology', 'approach', 'system', 'plan', 'design',
      
      // Usefulness & application
      'useful', 'helpful', 'practical', 'apply', 'use', 'work', 'study', 'research',
      'project', 'business', 'career', 'development', 'relevant', 'applicable',
      'benefit', 'advantage', 'value', 'worthwhile',
      
      // Length & time
      'long', 'short', 'length', 'time', 'page', 'hour', 'day', 'week', 'quick',
      'slow', 'fast', 'duration', 'period',
      
      // Genre & category
      'genre', 'category', 'type', 'kind', 'fiction', 'non-fiction', 'textbook',
      'reference', 'self-help', 'business', 'technical', 'academic', 'popular',
      'classic', 'modern', 'contemporary', 'traditional',
      
      // Edition & version
      'edition', 'version', 'latest', 'first', 'new', 'old', 'updated', 'revised',
      'published', 'outdated', 'current', 'up-to-date', 'recent',
      
      // Price & value
      'price', 'cost', 'expensive', 'cheap', 'affordable', 'overpriced', 'value',
      'worth', 'buy', 'purchase', 'investment', 'money', 'cost-effective',
      
      // Availability & access
      'available', 'access', 'stock', 'find', 'get', 'buy', 'borrow', 'rent',
      'download', 'online', 'digital', 'physical', 'ebook', 'audiobook',
      
      // Reviews & ratings
      'review', 'rating', 'star', 'critic', 'expert', 'reader', 'opinion',
      'feedback', 'comment', 'praise', 'complaint', 'strength', 'weakness',
      'pro', 'con', 'positive', 'negative', 'mixed',
      
      // Context & background
      'context', 'background', 'history', 'origin', 'purpose', 'goal', 'aim',
      'objective', 'mission', 'vision', 'philosophy', 'approach', 'methodology',
      'framework', 'perspective', 'viewpoint', 'angle',
      
      // Impact & influence
      'impact', 'influence', 'important', 'significant', 'groundbreaking', 'revolutionary',
      'innovative', 'original', 'creative', 'unique', 'special', 'remarkable',
      'extraordinary', 'exceptional', 'outstanding', 'excellent', 'superb',
      'magnificent', 'wonderful', 'amazing', 'incredible', 'fantastic',
      
      // General question words
      'what', 'how', 'why', 'when', 'where', 'which', 'who', 'can', 'should', 'would',
      'could', 'might', 'may', 'will', 'do', 'does', 'is', 'are', 'was', 'were'
    ];
    
    const queryLower = query.toLowerCase();
    const hasBookKeywords = bookRelatedKeywords.some(keyword => queryLower.includes(keyword));
    
    if (totalContextLength > 50 && hasBookKeywords) {
      console.log('Fallback: Query allowed - contains book-related keywords and has content');
      return true;
    }
    
    if (totalContextLength > 100) {
      console.log('Fallback: Query allowed due to substantial context available');
      return true;
    }

    // Be very permissive - if the query contains any book-related words, allow it
    if (hasBookKeywords) {
      console.log('Fallback: Query allowed - contains book-related keywords');
      return true;
    }

    console.log('Fallback: Query not relevant - insufficient context and no book-related keywords');
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
