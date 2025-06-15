
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-center py-4 mt-8 border-t border-gray-700 bg-gray-800">
      <p className="text-sm text-gray-400">
        Copyright © {currentYear} Ewako Royal - Dev By{' '}
        <a 
          href="https://bbaindonesia.net" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-yellow-500 hover:text-yellow-400 underline"
        >
          BBA Indonesia
        </a>
      </p>
      <p className="text-xs text-gray-500 mt-1">
        <Link to="/privacy-policy" className="hover:text-yellow-500 underline">
          Kebijakan Privasi
        </Link>
      </p>
    </footer>
  );
};
