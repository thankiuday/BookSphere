import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, RefreshCw, Download, FileText, User as UserIcon } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const ChatBox = ({ book, subdomain }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  // Add welcome message on component mount
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: `👋 Welcome to the chat for "${book.title}"! 

I'm your AI assistant for this book. I can help you understand the content, answer questions, and provide insights based on what's in the book.

📚 **What you can ask me:**
• Questions about specific topics in the book
• Explanations of concepts mentioned in the book
• Summaries of chapters or sections
• Clarifications about the book's content
• Responses in different languages (e.g., "explain in Hindi", "translate to Spanish")

🌍 **Multilingual Support:**
• Ask for responses in any language: "explain in Hindi", "in Spanish", "translate to French"
• Get book summaries in your preferred language
• Ask questions in your native language

❌ **What I cannot help with:**
• Questions unrelated to this book
• General knowledge outside the book's scope
• Information about other books or authors

Feel free to start asking questions about the book!`,
        timestamp: new Date(),
        id: 'welcome'
      };
      setMessages([welcomeMessage]);
    }
  }, [book.title, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDownloadPDF = () => {
    if (book.downloadUrl) {
      window.open(book.downloadUrl, '_blank');
    } else {
      toast.error('PDF download link not available');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      id: Date.now()
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await api.post('/chat', {
        message: userMessage,
        sessionId,
        subdomain
      });

      const { response: aiResponse, sessionId: newSessionId, isRestricted } = response.data;

      // Set session ID if it's a new session
      if (newSessionId && !sessionId) {
        setSessionId(newSessionId);
      }

      // Add AI response to chat
      const newAiMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        id: Date.now() + 1,
        isRestricted
      };

      setMessages(prev => [...prev, newAiMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        id: Date.now() + 1,
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
    toast.success('Chat cleared');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Chat Header - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 sm:p-4 rounded-t-xl mx-2 sm:mx-6 lg:mx-8 mt-2 sm:mt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-mixed rounded-lg flex items-center justify-center shadow-glow flex-shrink-0">
              <Bot className="w-3 h-3 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif font-bold text-sm sm:text-lg text-gray-900 truncate">
                Chat with "{book?.title}"
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                by {book?.authorName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            {book?.downloadUrl && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center space-x-1 px-2 py-1 text-accent-900 hover:text-accent-800 hover:bg-accent-50 rounded-lg transition-colors duration-200"
                title="Download PDF"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs hidden sm:inline">Download</span>
              </button>
            )}
            <button
              onClick={clearChat}
              className="flex items-center space-x-1 px-2 py-1 text-gray-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors duration-200"
              title="Clear Chat"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 py-3 sm:p-4 space-y-2 sm:space-y-4 bg-gray-50 mx-2 sm:mx-6 lg:mx-8">
        {messages.length === 0 && (
          <div className="text-center py-6 sm:py-8">
            <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto px-4 mb-4">
              Ask questions about "{book?.title}" and I'll help you understand the content. 
              I can only answer questions related to this book.
            </p>
            <div className="text-xs text-gray-400 max-w-md mx-auto px-4">
              <p className="mb-2">💡 <strong>Try asking:</strong></p>
              <p>• "What is this book about?"</p>
              <p>• "Explain in Hindi"</p>
              <p>• "Summarize in Spanish"</p>
              <p>• "What are the main topics?"</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-md lg:max-w-2xl xl:max-w-4xl px-3 py-2 sm:px-4 sm:py-3 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-gradient-primary text-white'
                  : message.isRestricted || message.isError
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-white text-gray-900 shadow-soft'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className={`w-3 h-3 sm:w-5 sm:h-5 mt-1 flex-shrink-0 ${
                    message.isRestricted || message.isError ? 'text-red-600' : 'text-accent-900'
                  }`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 sm:mt-2 ${
                    message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
                {message.role === 'user' && (
                  <User className="w-3 h-3 sm:w-5 sm:h-5 mt-1 text-primary-100 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 shadow-soft px-3 sm:px-4 py-2 sm:py-3 rounded-2xl">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-accent-900" />
                <span className="text-xs sm:text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-3 sm:p-4 rounded-b-xl mx-2 sm:mx-6 lg:mx-8 mb-2 sm:mb-0">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask a question about this book..."
            className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="bg-gradient-primary text-white px-3 py-2 sm:px-4 sm:py-3 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center px-2">
          Chat restricted to "{book?.title}" content
          <span className="block sm:inline sm:ml-1 text-accent-600 font-medium">💡 Try: "explain in Hindi"</span>
        </p>
      </div>
    </div>
  );
};

export default ChatBox;
