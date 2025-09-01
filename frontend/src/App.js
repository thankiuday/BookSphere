import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AuthorLoginPage from './pages/AuthorLoginPage';
import AuthorRegisterPage from './pages/AuthorRegisterPage';
import AuthorDashboardPage from './pages/AuthorDashboardPage';
import AuthorUploadPage from './pages/AuthorUploadPage';
import ReaderChatPage from './pages/ReaderChatPage';


import BookListPage from './pages/BookListPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background-50">
        <Navbar />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat/:subdomain" element={<ReaderChatPage />} />
            <Route path="/chatwith/:subdomain" element={<ReaderChatPage />} />
            <Route path="/login" element={<AuthorLoginPage />} />
            <Route path="/register" element={<AuthorRegisterPage />} />
            <Route path="/books" element={<BookListPage />} />
            
            {/* Protected Author Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AuthorDashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <AuthorUploadPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={
              <div className="min-h-screen bg-background-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                  <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
                  <a href="/" className="btn-primary">Go Home</a>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
