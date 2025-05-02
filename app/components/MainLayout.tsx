'use client';

import { ReactNode } from 'react';
import Navbar from './Navbar';
import { useAppStore } from '../lib/store';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isLoading, error } = useAppStore();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-primary-focus">
          <div className="h-1 bg-primary animate-pulse"></div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-error">
            <span>{error}</span>
            <button 
              className="btn btn-sm btn-circle btn-ghost" 
              onClick={() => useAppStore.getState().setError(null)}
            >✕</button>
          </div>
        </div>
      )}
      
      <main className="flex-1 container mx-auto p-4 pt-8">
        {children}
      </main>
      
      <footer className="footer footer-center p-4 bg-base-200 text-base-content mt-8">
        <div>
          <p>© {new Date().getFullYear()} - VLM Document Annotation Tool</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 