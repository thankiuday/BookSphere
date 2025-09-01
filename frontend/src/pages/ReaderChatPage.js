import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import ChatBox from '../components/ChatBox';
import api from '../utils/api';

const ReaderChatPage = () => {
  const { subdomain } = useParams();
  console.log('ReaderChatPage rendered with subdomain:', subdomain);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/books/${subdomain}`);
        setBook(response.data.book);
      } catch (error) {
        console.error('Error fetching book:', error);
        setError('Book not found or no longer available');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [subdomain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading book...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-background-50 flex items-center justify-center pt-16">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            Book Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'The book you are looking for could not be found.'}
          </p>
          <a
            href="/books"
            className="btn-primary"
          >
            Browse Other Books
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-50 pt-16">
      {/* Chat Interface - full height below navbar */}
      <div className="h-[calc(100vh-64px)]">
        <ChatBox book={book} subdomain={subdomain} />
      </div>
    </div>
  );
};

export default ReaderChatPage;
