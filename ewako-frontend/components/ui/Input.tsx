import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

// Wrap component with React.memo
const InputComponent: React.FC<InputProps> = ({ label, id, error, icon, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <div className="relative rounded-md shadow-sm">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
        <input
          id={id}
          name={props.name || id} // Ensure name attribute is set if passed or use id
          className={`
            form-input block w-full sm:text-sm rounded-md bg-gray-700 border-gray-600 text-white
            focus:ring-yellow-500 focus:border-yellow-500
            ${icon ? 'pl-10' : 'px-3'} py-2
            ${error ? 'border-red-500' : 'border-gray-600'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};

export const Input = React.memo(InputComponent);