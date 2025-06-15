import React from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer'; // Import Footer
import { useAuth } from '../App.tsx'; 

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { userRole } = useAuth(); 

  return (
    <div className="flex flex-col min-h-screen bg-[#1A1A1A]">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 pb-24"> 
        {/* pb-24 (6rem) is for BottomNav (h-16 is 4rem) */}
        {children}
        <Footer /> {/* Footer is now the last element within the main scrollable content area */}
      </main>
      <BottomNav userRole={userRole} /> 
    </div>
  );
};