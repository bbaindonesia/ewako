import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string; // Added placeholder to props interface
}

export const Select: React.FC<SelectProps> = ({ label, id, error, options, className, placeholder, ...restProps }) => { // Destructured placeholder
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
      <select
        id={id}
        className={`
          form-select block w-full sm:text-sm rounded-md bg-gray-700 border-gray-600 text-white
          focus:ring-yellow-500 focus:border-yellow-500 px-3 py-2
          ${error ? 'border-red-500' : 'border-gray-600'}
          ${className}
        `}
        {...restProps} // Spread the rest of the HTMLSelectAttributes
      >
        {placeholder && <option value="">{placeholder}</option>} {/* Use the destructured placeholder for the first option */}
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};