import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, BookOpen, User, Calendar, Eye, MessageCircle, QrCode } from 'lucide-react';

const BookDetailsModal = ({ book, isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen || !book) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleChatWithBook = () => {
    onClose();
    navigate(`/chat/${book.subdomain}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">Book Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Book Info */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-1 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary-900 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-500 truncate">
                  {book.subject || 'General'}
                </span>
              </div>
              {book.publicationYear && (
                <span className="text-xs sm:text-sm text-gray-500">
                  {book.publicationYear}
                </span>
              )}
            </div>
            
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              {book.title}
            </h3>
            
            <div className="flex items-center space-x-2 mb-3">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm sm:text-base text-gray-600 truncate">
                {book.authorName}
              </span>
            </div>
            
            {book.description && (
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {book.description}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-xs sm:text-sm text-gray-500 mb-4 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-4 sm:space-x-6">
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{book.viewCount || 0} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{book.chatCount || 0} chats</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Added {formatDate(book.createdAt)}</span>
              </div>
            </div>

            {book.tags && book.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {book.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* QR Code Section */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-primary-900" />
              <h4 className="text-base sm:text-lg font-medium text-gray-900">QR Code</h4>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center">
              {book.qrCodeUrl ? (
                <div>
                  <img
                    src={book.qrCodeUrl}
                    alt={`QR Code for ${book.title}`}
                    className="mx-auto mb-3 w-32 h-32 sm:w-48 sm:h-48"
                  />
                  <p className="text-xs sm:text-sm text-gray-600">
                    Scan this QR code to quickly access this book
                  </p>
                </div>
              ) : (
                <div className="py-6 sm:py-8">
                  <QrCode className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">QR code not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleChatWithBook}
              className="btn-primary flex-1 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Chat with Book</span>
            </button>
            
            {book.fileUrl && (
              <a
                href={book.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Download PDF</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsModal;
