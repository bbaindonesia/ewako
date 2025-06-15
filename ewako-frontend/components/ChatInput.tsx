
import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { PaperAirplaneIcon, PaperClipIcon } from '@heroicons/react/24/solid';
import { Input } from './ui/Input';

interface ChatInputProps {
  onSendMessage: (text?: string, file?: File) => void;
  isLoading?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (text.trim() === '' && !selectedFile) return;
    onSendMessage(text.trim() !== '' ? text : undefined, selectedFile || undefined);
    setText('');
    setSelectedFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for allowed types (optional)
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (allowedTypes.includes(file.type) && file.size < 5 * 1024 * 1024) { // Max 5MB
          setSelectedFile(file);
      } else {
          alert('File tidak valid. Hanya JPG, PNG, PDF yang diizinkan (maks 5MB).');
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline in input
      handleSend();
    }
  };


  return (
    <div className="p-3 border-t border-gray-700 bg-gray-800">
      {selectedFile && (
        <div className="mb-2 text-xs text-gray-300">
          File terlampir: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          <button 
            onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }} 
            className="ml-2 text-red-400 hover:text-red-300"
          >
            [&times;]
          </button>
        </div>
      )}
      <div className="flex items-center space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          id="chat-file-input"
          accept=".jpg,.jpeg,.png,.pdf"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="!p-2"
          aria-label="Lampirkan file"
        >
          <PaperClipIcon className="h-5 w-5" />
        </Button>
        <Input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ketik pesan Anda..."
          className="flex-grow !bg-gray-700 !border-gray-600 focus:!ring-yellow-500 focus:!border-yellow-500"
          disabled={isLoading}
        />
        <Button onClick={handleSend} isLoading={isLoading} disabled={!text.trim() && !selectedFile} size="sm" className="!p-2">
          <PaperAirplaneIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
