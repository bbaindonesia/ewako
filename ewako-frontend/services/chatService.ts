import { ChatMessage } from '../types';
import fetchApi from './api';
// import * as orderService from './orderService'; // No longer needed to update order directly for chat history

export const getChatMessagesForOrder = async (orderId: string): Promise<ChatMessage[]> => {
  return fetchApi<ChatMessage[]>(`/orders/${orderId}/chat`);
};

export const sendChatMessage = async (
  orderId: string,
  senderName: string, // Admin name or customer name
  senderId: string,   // 'adminUser' or customer's userId
  text?: string,
  file?: File
): Promise<ChatMessage | null> => {
  if (!text && !file) {
    console.error("Chat message must have text or a file.");
    return null;
  }

  const formData = new FormData();
  formData.append('orderId', orderId);
  formData.append('senderName', senderName);
  formData.append('senderId', senderId);
  if (text) {
    formData.append('text', text);
  }
  if (file) {
    formData.append('file', file, file.name);
  }

  try {
    const newMessage = await fetchApi<ChatMessage>(`/orders/${orderId}/chat`, {
      method: 'POST',
      body: formData,
      isFormData: true, // Important: signals fetchApi to handle FormData correctly
    });
    
    // Simulate notification (replace with actual PWA notification if implemented)
    // This part can remain if you still want console logs or simple browser notifications
    const receiver = senderId === 'adminUser' ? 'Customer' : 'Admin Ewako';
     console.log(`%c[API Chat Notification for ${receiver} on Order ${orderId}]%c\nFrom: ${senderName}\nMessage: ${text || `File: ${file?.name}`}`, 'color: blue; font-weight: bold;', 'color: black;');

    return newMessage;
  } catch (error) {
    console.error("Failed to send chat message via API:", error);
    return null;
  }
};
