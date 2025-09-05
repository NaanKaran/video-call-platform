import React from 'react';
import Navbar from './Navbar';

// Props type for Layout component
interface LayoutProps {
  children: React.ReactNode;
}

// Main layout component that wraps all pages
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Navigation bar */}
      <Navbar />
      
      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      
      {/* Footer - only show on non-full-screen pages */}
      <footer className="bg-white border-t border-gray-200 py-2 flex-shrink-0 hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-xs">
            © 2024 Video Call Platform
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;