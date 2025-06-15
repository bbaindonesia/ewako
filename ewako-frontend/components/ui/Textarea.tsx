
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <textarea
        id={id}
        className={`
          form-textarea block w-full sm:text-sm rounded-md bg-gray-700 border-gray-600 text-white
          focus:ring-yellow-500 focus:border-yellow-500 px-3 py-2
          ${error ? 'border-red-500' : 'border-gray-600'}
          ${className}
        `}
        rows={3}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};
