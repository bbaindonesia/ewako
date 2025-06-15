
import React from 'react';
import { ChatMessage } from '../types';
import { PaperClipIcon, ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/solid';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  currentUserId: string; // To determine if the message is from the current user
}

const handleDownloadMockFile = (fileName: string, fileType?: string, fileDataUrl?: string) => {
  if (fileDataUrl && fileType?.startsWith('image/')) {
    // For images with data URL, open in new tab (can also be downloaded from there)
    const newTab = window.open();
    if (newTab) {
      newTab.document.write(`<img src="${fileDataUrl}" style="max-width:100%; max-height:100vh;" alt="${fileName}" />`);
      newTab.document.title = fileName;
    }
    return;
  }

  let content = '';
  let mimeType = fileType || 'application/octet-stream';
  let effectiveFileName = fileName;

  if (fileType?.startsWith('image/')) {
    content = `This is a mock preview for the image: ${fileName}.\nIn a real app, this would be the actual image data.`;
     // For images without dataURL (e.g. too large), provide a text file mock
    effectiveFileName = `${fileName.split('.')[0]}_mock_preview.txt`;
    mimeType = 'text/plain';
  } else if (fileType === 'application/pdf') {
    content = `This is a mock PDF document: ${fileName}.\n\nContent of the PDF would be here.`;
    // To ensure it's downloadable as a "text" representation of a PDF for mock purposes:
    effectiveFileName = `${fileName.split('.')[0]}_mock.txt`; 
    mimeType = 'text/plain';
  } else {
    content = `Mock file content for: ${fileName}.\nFile Type: ${fileType || 'Unknown'}`;
    effectiveFileName = `${fileName.split('.')[0]}_mock.txt`;
    mimeType = 'text/plain';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = effectiveFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};


export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, currentUserId }) => {
  const isSender = message.senderId === currentUserId;

  return (
    <div className={`flex mb-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-3 py-2 rounded-xl shadow ${ // Reduced padding slightly
          isSender
            ? 'bg-yellow-500 metallic-gold-text text-black rounded-br-none'
            : 'bg-gray-700 text-white rounded-bl-none'
        }`}
      >
        {!isSender && (
          <p className="text-xs font-semibold mb-0.5 opacity-80">{message.sender}</p>
        )}
        {message.text && <p className="text-sm break-words">{message.text}</p>}
        
        {/* File Attachment Display */}
        {message.fileDataUrl && message.fileType?.startsWith('image/') ? (
          // Image Preview
          <div className="mt-1.5 cursor-pointer" onClick={() => handleDownloadMockFile(message.fileName!, message.fileType, message.fileDataUrl)}>
            <img 
              src={message.fileDataUrl} 
              alt={message.fileName || 'Image attachment'} 
              className="rounded-md max-w-full h-auto max-h-48 object-contain" // Constrain preview size
            />
            <div className="flex items-center justify-between text-xs mt-1">
              <span className={`${isSender ? 'text-gray-800' : 'text-gray-300'} opacity-90`}>{message.fileName}</span>
              <ArrowTopRightOnSquareIcon className={`h-3 w-3 ${isSender ? 'text-gray-700' : 'text-gray-400'} opacity-70`} title="Buka di tab baru"/>
            </div>
          </div>
        ) : message.fileName && message.fileType ? (
          // Download Link for other files or large images
          <button
            onClick={() => handleDownloadMockFile(message.fileName!, message.fileType, message.fileDataUrl)}
            className={`mt-1.5 p-2 w-full bg-black bg-opacity-10 hover:bg-opacity-20 rounded-md flex items-center space-x-2 text-left transition-colors duration-150 ${isSender ? 'text-gray-800' : 'text-gray-200'}`}
            title={`Download mock file: ${message.fileName}`}
          >
            <ArrowDownTrayIcon className={`h-4 w-4 flex-shrink-0 ${isSender ? 'text-gray-700' : 'text-gray-300'}`} />
            <span className="text-xs italic flex-grow truncate">
              {message.fileName} <span className="text-gray-400 text-[10px]">({message.fileType?.split('/')[1] || 'file'})</span>
            </span>
          </button>
        ) : null}

        <p className={`text-xs mt-1 ${isSender ? 'text-right text-gray-800 opacity-70' : 'text-left text-gray-400 opacity-70'}`}>
          {new Date(message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};
