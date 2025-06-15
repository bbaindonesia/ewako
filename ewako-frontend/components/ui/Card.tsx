
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, title, onClick }) => {
  return (
    <div
      className={`bg-gray-800 shadow-xl rounded-xl overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-2xl transition-shadow duration-300' : ''} ${className}`}
      onClick={onClick}
    >
      {title && (
        <div className="metallic-red-bg p-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
      )}
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
};
