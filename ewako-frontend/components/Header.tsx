import React from 'react';
import { APP_NAME } from '../constants';
// import { TimeDisplay } from './TimeDisplay'; // Removed
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 metallic-red-bg text-white shadow-lg p-3 md:p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl md:text-3xl font-bold tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {APP_NAME}
        </Link>
        {/* <TimeDisplay /> Removed */}
      </div>
    </header>
  );
};