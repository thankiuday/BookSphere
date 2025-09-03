import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, QrCode, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const AuthorUploadPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    publicationYear: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB
        toast.error('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a PDF file');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a book title');
      return;
    }

    setIsUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('pdfFile', selectedFile);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);

      uploadFormData.append('publicationYear', formData.publicationYear);
      uploadFormData.append('tags', formData.tags);

      const response = await api.post('/books/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadResult(response.data.book);
      toast.success('Book uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      
      // Handle different types of errors
      if (error.response?.data?.details) {
        // Validation errors
        const validationErrors = error.response.data.details;
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach(err => {
            toast.error(`${err.param}: ${err.msg}`);
          });
        } else {
          toast.error(error.response.data.message || 'Validation error occurred');
        }
      } else if (error.response?.data?.message) {
        // General server error
        toast.error(error.response.data.message);
      } else if (error.message) {
        // Network or other errors
        toast.error(error.message);
      } else {
        toast.error('Upload failed. Please try again.');
      }
    } finally {
      setIsUploading(false);
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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      publicationYear: '',
      tags: ''
    });
    setSelectedFile(null);
    setUploadResult(null);
  };

  if (uploadResult) {
    return (
      <div className="min-h-screen bg-background-50 pt-16 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2">
              Book Uploaded Successfully!
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Your book is now available for readers to chat with
            </p>
          </div>

          {/* Book Details */}
          <div className="modern-card mb-6 sm:mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
                  Book Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">Title</label>
                    <p className="text-sm sm:text-base text-gray-900 break-words">{uploadResult.title}</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">Subdomain</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm sm:text-base text-gray-900 font-mono break-all">{uploadResult.subdomain}</p>
                      <button
                        onClick={() => copyToClipboard(uploadResult.subdomain)}
                        className="text-primary-900 hover:text-primary-800 flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-500">Book URL</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs sm:text-sm text-gray-900 font-mono break-all">{uploadResult.bookUrl}</p>
                      <button
                        onClick={() => copyToClipboard(uploadResult.bookUrl)}
                        className="text-primary-900 hover:text-primary-800 flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
                  QR Code
                </h2>
                <div className="text-center">
                  <img
                    src={uploadResult.qrCodeUrl}
                    alt="QR Code"
                    className="w-32 h-32 sm:w-48 sm:h-48 mx-auto border border-gray-200 rounded-lg"
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    Scan this QR code to access the book chat
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary text-sm sm:text-base"
            >
              Go to Dashboard
            </button>
            <button
              onClick={resetForm}
              className="btn-outline text-sm sm:text-base"
            >
              Upload Another Book
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-50 pt-16 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-2">
            Upload Your Book
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Share your knowledge with the community
          </p>
        </div>

        {/* Upload Form */}
        <div className="modern-card">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 text-center hover:border-primary-900 transition-colors duration-200">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    {selectedFile ? selectedFile.name : 'Click to select PDF file'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Maximum file size: 50MB
                  </p>
                </label>
              </div>
              {selectedFile && (
                <div className="mt-2 flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate">{selectedFile.name}</span>
                  <span>({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            {/* Book Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Book Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter the book title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Brief description of the book content"
              />
            </div>



            {/* Publication Year */}
            <div>
              <label htmlFor="publicationYear" className="block text-sm font-medium text-gray-700 mb-2">
                Publication Year
              </label>
              <input
                type="number"
                id="publicationYear"
                name="publicationYear"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.publicationYear}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g., 2024"
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g., AI, machine learning, algorithms"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full btn-primary py-3 text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading book...</span>
                </div>
              ) : (
                'Upload Book'
              )}
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-4 sm:p-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-primary-900" />
            </div>
            <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">Upload PDF</h3>
            <p className="text-xs sm:text-sm text-gray-600">Upload your book in PDF format</p>
          </div>
          <div className="text-center p-4 sm:p-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-accent-900" />
            </div>
            <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">Get QR Code</h3>
            <p className="text-xs sm:text-sm text-gray-600">Receive a unique QR code for sharing</p>
          </div>
          <div className="text-center p-4 sm:p-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-900" />
            </div>
            <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">Share & Chat</h3>
            <p className="text-xs sm:text-sm text-gray-600">Readers can chat with your book content</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorUploadPage;
