import React from 'react';
import Navbar from './Navbar';

// Props type for Layout component
interface LayoutProps {
  children: React.ReactNode;
}

// Main layout component that wraps all pages
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation bar */}
      <Navbar />
      
      {/* Main content area */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            © 2024 Video Call Platform. Built for educational video sessions.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;