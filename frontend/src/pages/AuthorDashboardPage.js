import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Upload, Eye, MessageCircle, Calendar, Copy, ExternalLink, QrCode, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const AuthorDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRCode, setSelectedQRCode] = useState(null);
  const [deletingBookId, setDeletingBookId] = useState(null);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalViews: 0,
    totalChats: 0
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/books/my-books');
      setBooks(response.data.books);
      
      // Calculate stats
      const totalViews = response.data.books.reduce((sum, book) => sum + (book.viewCount || 0), 0);
      const totalChats = response.data.books.reduce((sum, book) => sum + (book.chatCount || 0), 0);
      
      setStats({
        totalBooks: response.data.totalBooks,
        totalViews,
        totalChats
      });
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to load your books');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDeleteClick = (book) => {
    setBookToDelete(book);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;

    try {
      setDeletingBookId(bookToDelete._id);
      await api.delete(`/books/${bookToDelete._id}`);
      
      // Remove book from local state
      setBooks(books.filter(book => book._id !== bookToDelete._id));
      
      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        totalBooks: prevStats.totalBooks - 1,
        totalViews: prevStats.totalViews - (bookToDelete.viewCount || 0),
        totalChats: prevStats.totalChats - (bookToDelete.chatCount || 0)
      }));

      toast.success('Book deleted successfully!');
      setBookToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete book');
    } finally {
      setDeletingBookId(null);
    }
  };

  const handleDeleteCancel = () => {
    setBookToDelete(null);
  };

  const downloadQRCode = async (qrCodeUrl, title) => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}-qr-code.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('QR code downloaded!');
    } catch (error) {
      toast.error('Failed to download QR code');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-50 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-50 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your books and track their performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="card p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary-900" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Books</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
              </div>
            </div>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-accent-900" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Views</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              </div>
            </div>
          </div>

          <div className="card p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-900" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Total Chats</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalChats}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <Link
            to="/upload"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload New Book</span>
          </Link>
        </div>

        {/* Books List */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold text-gray-900">
              Your Books
            </h2>
            <span className="text-sm text-gray-500">
              {books.length} book{books.length !== 1 ? 's' : ''}
            </span>
          </div>

          {books.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No books yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start by uploading your first book to share with readers
              </p>
              <Link
                to="/upload"
                className="btn-primary"
              >
                Upload Your First Book
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {books.map((book) => (
                <div key={book._id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-soft transition-shadow duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                    <div className="flex-1 mb-4 sm:mb-0">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                        {book.title}
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-500 mb-3 space-y-1 sm:space-y-0">
                        <span className="break-all">Subdomain: {book.subdomain}</span>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center space-x-4">
                          <span>Views: {book.viewCount || 0}</span>
                          <span>•</span>
                          <span>Chats: {book.chatCount || 0}</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <span>Uploaded: {formatDate(book.createdAt)}</span>
                      </div>
                      {book.description && (
                        <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
                          {book.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-end space-x-1 sm:space-x-2 sm:ml-4 flex-shrink-0">
                      <button
                        onClick={() => copyToClipboard(book.subdomain)}
                        className="p-2 text-gray-400 hover:text-primary-900 transition-colors duration-200"
                        title="Copy subdomain"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={book.bookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-primary-900 transition-colors duration-200"
                        title="View book"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteClick(book)}
                        disabled={deletingBookId === book._id}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 disabled:opacity-50"
                        title="Delete book"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* QR Code Section */}
                  {book.qrCodeUrl && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900 flex items-center">
                          <QrCode className="w-4 h-4 mr-2" />
                          QR Code
                        </h4>
                        <button
                          onClick={() => copyToClipboard(book.bookUrl)}
                          className="text-xs text-primary-900 hover:text-primary-800 font-medium"
                        >
                          Copy URL
                        </button>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setSelectedQRCode({ url: book.qrCodeUrl, title: book.title, bookUrl: book.bookUrl })}
                          className="hover:opacity-80 transition-opacity duration-200"
                        >
                          <img
                            src={book.qrCodeUrl}
                            alt="QR Code"
                            className="w-16 h-16 border border-gray-200 rounded-lg cursor-pointer"
                          />
                        </button>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 mb-1">
                            Scan this QR code to access the book chat
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {book.bookUrl}
                          </p>
                          <div className="flex space-x-2 mt-1">
                            <button
                              onClick={() => setSelectedQRCode({ url: book.qrCodeUrl, title: book.title, bookUrl: book.bookUrl })}
                              className="text-xs text-primary-900 hover:text-primary-800 font-medium"
                            >
                              View larger
                            </button>
                            <button
                              onClick={() => downloadQRCode(book.qrCodeUrl, book.title)}
                              className="text-xs text-accent-900 hover:text-accent-800 font-medium"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-4 border-t border-gray-100 space-y-3 sm:space-y-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                        <span className="text-xs text-gray-500">
                          Status: {book.isPublic ? 'Public' : 'Private'}
                        </span>
                        {book.processingStatus && (
                          <span className={`text-xs px-2 py-1 rounded-full inline-block ${
                            book.processingStatus === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : book.processingStatus === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {book.processingStatus}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <a
                          href={book.bookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                        >
                          View Book
                        </a>
                        <button
                          onClick={() => navigate(`/chat/${book.subdomain}`)}
                          className="btn-secondary text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
                        >
                          Test Chat
                        </button>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                QR Code - {selectedQRCode.title}
              </h3>
              <button
                onClick={() => setSelectedQRCode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-4">
              <img
                src={selectedQRCode.url}
                alt="QR Code"
                className="w-48 h-48 mx-auto border border-gray-200 rounded-lg"
              />
            </div>
            
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Scan this QR code to access the book chat
              </p>
              <p className="text-xs text-gray-500 font-mono break-all">
                {selectedQRCode.bookUrl}
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => copyToClipboard(selectedQRCode.bookUrl)}
                className="flex-1 btn-outline text-sm"
              >
                Copy URL
              </button>
              <button
                onClick={() => downloadQRCode(selectedQRCode.url, selectedQRCode.title)}
                className="flex-1 btn-secondary text-sm"
              >
                Download
              </button>
              <button
                onClick={() => setSelectedQRCode(null)}
                className="flex-1 btn-primary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Book</h3>
              <button
                onClick={handleDeleteCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete this book?
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-900">{bookToDelete.title}</p>
                <p className="text-sm text-gray-500">Subdomain: {bookToDelete.subdomain}</p>
              </div>
              <p className="text-sm text-red-600 mt-2">
                This action cannot be undone. All chat history and QR codes will be permanently deleted.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 btn-outline text-sm"
                disabled={deletingBookId === bookToDelete._id}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingBookId === bookToDelete._id}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingBookId === bookToDelete._id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete Book'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorDashboardPage;
