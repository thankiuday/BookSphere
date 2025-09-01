import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import AuthorLoginPage from './pages/AuthorLoginPage';
import AuthorRegisterPage from './pages/AuthorRegisterPage';
import AuthorUploadPage from './pages/AuthorUploadPage';
import AuthorDashboardPage from './pages/AuthorDashboardPage';
import ReaderChatPage from './pages/ReaderChatPage';
import BookListPage from './pages/BookListPage';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthorLoginPage />} />
            <Route path="/register" element={<AuthorRegisterPage />} />
            <Route path="/books" element={<BookListPage />} />
            <Route path="/chat/:subdomain" element={<ReaderChatPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AuthorDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <AuthorUploadPage />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
