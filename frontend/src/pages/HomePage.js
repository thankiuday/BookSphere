import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Upload, MessageCircle, QrCode, Users, Award } from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: Upload,
      title: 'Upload Books',
      description: 'Authors can upload PDF books and get unique subdomains with QR codes for easy sharing.',
      color: 'from-primary-900 to-primary-700'
    },
    {
      icon: QrCode,
      title: 'QR Code Generation',
      description: 'Each book gets a unique QR code that readers can scan to access the chat interface.',
      color: 'from-accent-900 to-accent-700'
    },
    {
      icon: MessageCircle,
      title: 'AI-Powered Chat',
      description: 'Readers can chat with book content using AI, with responses restricted to the book\'s content.',
      color: 'from-purple-600 to-purple-800'
    },
    {
      icon: Users,
      title: 'Global Author Community',
      description: 'Connect with authors and readers worldwide, from fiction writers to non-fiction experts.',
      color: 'from-green-600 to-green-800'
    }
  ];

  const stats = [
    { label: 'Books Uploaded', value: '100+', icon: BookOpen },
    { label: 'Active Authors', value: '50+', icon: Users },
    { label: 'Chat Sessions', value: '1000+', icon: MessageCircle },
    { label: 'Global Reach', value: '25+ Countries', icon: Award }
  ];

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-mixed text-white py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 sm:mb-6 leading-tight">
              Chat with a Book
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-white/90 max-w-3xl mx-auto px-4 leading-relaxed">
              Transform how readers interact with your books through AI-powered conversations. Connect with your audience globally.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Link
                to="/register"
                className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto"
              >
                Get Started
              </Link>
              <Link
                to="/books"
                className="btn-outline text-base sm:text-lg px-6 sm:px-8 py-3 border-white text-white hover:bg-white hover:text-primary-900 w-full sm:w-auto"
              >
                Browse Books
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              BookSphere revolutionizes how authors share their knowledge and how readers engage with books through intelligent AI conversations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center modern-card">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-glow`}>
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-gray-900 mb-2 sm:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center modern-card p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4 shadow-glow">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div className="text-lg sm:text-2xl lg:text-3xl font-serif font-bold text-primary-900 mb-1 sm:mb-2">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm lg:text-base text-gray-600">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-mixed text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-4 sm:mb-6">
            Ready to Transform How Readers Engage with Your Books?
          </h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-white/90">
            Join our innovative platform for authors to share knowledge and connect with readers worldwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link
              to="/register"
              className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto"
            >
              Start Uploading Books
            </Link>
            <Link
              to="/books"
              className="btn-outline text-base sm:text-lg px-6 sm:px-8 py-3 border-white text-white hover:bg-white hover:text-primary-900 w-full sm:w-auto"
            >
              Explore Books
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
              <div className="w-8 h-8 bg-gradient-mixed rounded-lg flex items-center justify-center shadow-glow">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-serif font-bold">
                BookSphere
              </span>
            </div>
            <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">
              AI-Powered Platform for Authors to Connect with Readers
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              © 2024 BookSphere. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
