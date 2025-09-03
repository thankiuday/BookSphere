import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, User, Calendar, Eye, MessageCircle } from 'lucide-react';
import api from '../utils/api';
import BookDetailsModal from '../components/BookDetailsModal';

const BookListPage = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, [currentPage, searchTerm]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await api.get(`/books/public/list?${params}`);
      setBooks(response.data.books);
      setTotalPages(response.data.totalPages);
      setTotalBooks(response.data.totalBooks);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewDetails = (book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
  };

  return (
    <div className="min-h-screen bg-background-50 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2">
            Browse Books
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Discover and chat with books from authors worldwide
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 sm:mb-8">
          <form onSubmit={handleSearch} className="max-w-full sm:max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search books or authors..."
                className="input-field pl-9 sm:pl-10 text-sm sm:text-base"
              />
            </div>
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-4 sm:mb-6 text-center">
          <p className="text-sm sm:text-base text-gray-600">
            {loading ? 'Loading...' : `${totalBooks} book${totalBooks !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="card animate-pulse p-4 sm:p-6">
                <div className="h-32 sm:h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No books found
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new books'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {books.map((book) => (
                <div key={book._id} className="card-hover p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    {book.publicationYear && (
                      <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
                        {book.publicationYear}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                    {book.title}
                  </h3>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600 truncate">
                      {book.authorName}
                    </span>
                  </div>
                  
                  {book.description && (
                    <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2 sm:line-clamp-3">
                      {book.description}
                    </p>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{book.viewCount || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{book.chatCount || 0}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(book.createdAt)}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleViewDetails(book)}
                    className="btn-primary w-full text-center text-sm sm:text-base"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Call to Action */}
        <div className="mt-8 sm:mt-12 text-center">
          <div className="bg-gradient-to-r from-primary-900 to-accent-900 rounded-2xl p-6 sm:p-8 text-white">
            <h2 className="text-xl sm:text-2xl font-serif font-bold mb-3 sm:mb-4">
              Are you an author?
            </h2>
            <p className="text-primary-100 mb-4 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base">
              Upload your books and make them interactive with AI-powered conversations. 
              Join a growing global community of authors.
            </p>
            <Link
              to="/register"
              className="btn-secondary inline-flex items-center space-x-2 text-sm sm:text-base"
            >
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Start Uploading Books</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Book Details Modal */}
      <BookDetailsModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default BookListPage;
