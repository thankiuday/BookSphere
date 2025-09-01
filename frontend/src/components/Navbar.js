import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, BookOpen, User, Upload, LogOut, Home } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Books', path: '/books', icon: BookOpen },
  ];

  const authorNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: User },
    { name: 'Upload Book', path: '/upload', icon: Upload },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect shadow-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-mixed rounded-xl flex items-center justify-center shadow-glow">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-serif font-bold text-gradient">
              BookSphere
            </span>
            <span className="text-sm text-gray-400 hidden sm:block">
              AI-Powered Book Chat
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                                                 <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                    isActive(item.path)
                      ? 'text-orange-600 bg-orange-100/50 shadow-glow'
                      : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50/50 hover:shadow-glow'
                  }`}
                >
                   <Icon className="w-4 h-4" />
                   <span>{item.name}</span>
                 </Link>
              );
            })}

            {isAuthenticated && (
              <>
                {authorNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                                                             <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center space-x-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                        isActive(item.path)
                          ? 'text-orange-600 bg-orange-100/50 shadow-glow'
                          : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50/50 hover:shadow-glow'
                      }`}
                    >
                       <Icon className="w-4 h-4" />
                       <span>{item.name}</span>
                     </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                                                 <div className="text-sm text-slate-600">
                  Welcome, <span className="font-medium text-orange-600">{user?.name}</span>
                </div>
                 <button
                   onClick={logout}
                   className="flex items-center space-x-1 px-3 py-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
                 >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="btn-outline text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

                     {/* Mobile menu button */}
           <div className="md:hidden">
             <button
               onClick={() => setIsMenuOpen(!isMenuOpen)}
               className="p-2 rounded-xl text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-all duration-300"
             >
               {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
           </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                                                       <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                      isActive(item.path)
                        ? 'text-orange-600 bg-orange-100/50 shadow-glow'
                        : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50/50'
                    }`}
                  >
                     <Icon className="w-4 h-4" />
                     <span>{item.name}</span>
                   </Link>
                );
              })}

              {isAuthenticated && (
                <>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Author Tools
                    </div>
                    {authorNavItems.map((item) => {
                      const Icon = item.icon;
                      return (
                                                                         <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setIsMenuOpen(false)}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                            isActive(item.path)
                              ? 'text-orange-600 bg-orange-100/50 shadow-glow'
                              : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50/50'
                          }`}
                        >
                           <Icon className="w-4 h-4" />
                           <span>{item.name}</span>
                         </Link>
                      );
                    })}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Welcome, {user?.name}
                    </div>
                                         <button
                       onClick={() => {
                         logout();
                         setIsMenuOpen(false);
                       }}
                       className="flex items-center space-x-2 px-3 py-2 w-full text-left text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-300"
                     >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}

              {!isAuthenticated && (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center btn-outline mb-2"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center btn-primary"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
