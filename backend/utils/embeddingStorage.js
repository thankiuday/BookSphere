const fs = require('fs').promises;
const path = require('path');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { OpenAIEmbeddings } = require('@langchain/openai');


// Storage directory for embeddings
const EMBEDDINGS_DIR = path.join(__dirname, '../data/embeddings');

// Ensure embeddings directory exists
const ensureEmbeddingsDir = async () => {
  try {
    await fs.access(EMBEDDINGS_DIR);
  } catch {
    await fs.mkdir(EMBEDDINGS_DIR, { recursive: true });
  }
};

// Store embeddings for a book
const storeEmbeddings = async (bookId, chunks, vectorStore) => {
  try {
    await ensureEmbeddingsDir();
    
    // Store the chunks directly since MemoryVectorStore doesn't have getDocuments()
    // We'll reconstruct the documents from chunks with their index as metadata
    const documents = chunks.map((chunk, index) => ({
      pageContent: chunk,
      metadata: { id: index }
    }));
    
    const embeddingData = {
      bookId,
      documents: documents,
      timestamp: new Date().toISOString()
    };
    
    // Ensure bookId is valid for filename (remove any invalid characters)
    const safeBookId = bookId.toString().replace(/[^a-zA-Z0-9-_]/g, '');
    const filePath = path.join(EMBEDDINGS_DIR, `${safeBookId}.json`);
    
    console.log(`Storing embeddings to: ${filePath}`);
    console.log(`Book ID: ${bookId}, Safe Book ID: ${safeBookId}`);
    console.log(`Embeddings directory: ${EMBEDDINGS_DIR}`);
    
    await fs.writeFile(filePath, JSON.stringify(embeddingData, null, 2));
    
    console.log(`Embeddings stored for book ${bookId} with ${documents.length} documents`);
    return true;
  } catch (error) {
    console.error('Error storing embeddings:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to store embeddings: ${error.message}`);
  }
};

// Load embeddings for a book
const loadEmbeddings = async (bookId) => {
  try {
    // Use the same safe bookId logic as in storeEmbeddings
    const safeBookId = bookId.toString().replace(/[^a-zA-Z0-9-_]/g, '');
    const filePath = path.join(EMBEDDINGS_DIR, `${safeBookId}.json`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.log(`No embeddings found for book ${bookId}`);
      return null;
    }
    
    const data = await fs.readFile(filePath, 'utf8');
    const embeddingData = JSON.parse(data);
    
    // Reconstruct vector store
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    
    let vectorStore;
    
    // Handle both old format (chunks) and new format (documents)
    if (embeddingData.documents) {
      // New format: documents with pageContent and metadata
      console.log(`Loading embeddings in new format for book ${bookId}`);
      vectorStore = await MemoryVectorStore.fromDocuments(
        embeddingData.documents,
        embeddings
      );
    } else if (embeddingData.chunks) {
      // Old format: just chunks array
      console.log(`Loading embeddings in old format for book ${bookId}`);
      vectorStore = await MemoryVectorStore.fromTexts(
        embeddingData.chunks,
        embeddingData.chunks.map((_, i) => ({ id: i })),
        embeddings
      );
    } else {
      console.error('Invalid embedding data format');
      throw new Error('Invalid embedding data format');
    }
    
    console.log(`Embeddings loaded for book ${bookId}`);
    return vectorStore;
  } catch (error) {
    console.error('Error loading embeddings:', error);
    throw new Error('Failed to load embeddings');
  }
};

// Delete embeddings for a book
const deleteEmbeddings = async (bookId) => {
  try {
    const safeBookId = bookId.toString().replace(/[^a-zA-Z0-9-_]/g, '');
    const filePath = path.join(EMBEDDINGS_DIR, `${safeBookId}.json`);
    
    try {
      await fs.unlink(filePath);
      console.log(`Embeddings deleted for book ${bookId}`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`No embeddings file found for book ${bookId}`);
        return true;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting embeddings:', error);
    throw new Error('Failed to delete embeddings');
  }
};

// Check if embeddings exist for a book
const embeddingsExist = async (bookId) => {
  try {
    const safeBookId = bookId.toString().replace(/[^a-zA-Z0-9-_]/g, '');
    const filePath = path.join(EMBEDDINGS_DIR, `${safeBookId}.json`);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  storeEmbeddings,
  loadEmbeddings,
  deleteEmbeddings,
  embeddingsExist
};
