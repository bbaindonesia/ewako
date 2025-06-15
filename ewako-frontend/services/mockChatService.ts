
import { ChatMessage, ChatParty, Order } from '../types';
import * as mockOrderService from './mockOrderService'; // Import as namespace

export const getChatMessagesForOrder = async (orderId: string): Promise<ChatMessage[]> => {
  const order = await mockOrderService.getOrderById(orderId);
  return order?.chatHistory || [];
};

// Helper function to read file as data URL
const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const sendChatMessage = async (
  orderId: string,
  senderName: string,
  senderId: string,
  text?: string,
  file?: File // Changed from fileDetails to actual File object
): Promise<ChatMessage | null> => {
  if (!text && !file) {
    console.error("Chat message must have text or a file.");
    return null;
  }

  const order = await mockOrderService.getOrderById(orderId);
  if (!order) {
    console.error("Order not found for chat message");
    return null;
  }

  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    orderId,
    timestamp: new Date().toISOString(),
    sender: senderName,
    senderId: senderId,
    text: text,
    isRead: false, // Default to unread
  };

  if (file) {
    newMessage.fileName = file.name;
    newMessage.fileType = file.type as 'image/jpeg' | 'image/png' | 'application/pdf'; // Cast, assuming ChatInput validates

    // Create a Data URL for small images for preview
    if (file.type.startsWith('image/') && file.size < 1 * 1024 * 1024) { // 1MB limit for Data URL
      try {
        newMessage.fileDataUrl = await readFileAsDataURL(file);
      } catch (e) {
        console.error("Error reading file as Data URL:", e);
        // fileDataUrl remains undefined, will fallback to download link in ChatMessageBubble
      }
    }
  }

  const updatedChatHistory = [...(order.chatHistory || []), newMessage];
  await mockOrderService.updateOrderChatHistory(orderId, updatedChatHistory);

  // Simulate notification (replace with actual PWA notification if implemented)
  const receiver = senderId === 'adminUser' ? 'Customer' : 'Admin Ewako';
  console.log(`%c[Mock Chat Notification for ${receiver} on Order ${orderId}]%c\nFrom: ${senderName}\nMessage: ${text || `File: ${newMessage.fileName}`}`, 'color: blue; font-weight: bold;', 'color: black;');

  return newMessage;
};
