
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Order, ChatMessage, User } from '../../types';
import { getAllOrders, getOrderById } from '../../services/orderService'; // Updated to real service
import { sendChatMessage, getChatMessagesForOrder } from '../../services/chatService'; // Updated to real service
import { ChatMessageBubble } from '../../components/ChatMessageBubble';
import { ChatInput } from '../../components/ChatInput';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { getUserById } from '../../services/userService'; // Updated to real service

const AdminChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { orderId: paramOrderId } = useParams<{ orderId?: string }>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderCustomer, setSelectedOrderCustomer] = useState<User | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const adminUserId = 'adminUser'; // This should ideally come from auth context in a real app
  const adminUserName = 'Admin Ewako'; // This should ideally come from auth context

  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const fetchedOrders = await getAllOrders();
      setOrders(fetchedOrders);
      if (paramOrderId) {
        // If an orderId is passed in params, try to select it.
        // If API call for getOrderById is preferred, adjust here.
        // For now, finding from the fetchedOrders list.
        const orderToSelect = fetchedOrders.find(o => o.id === paramOrderId);
        if (orderToSelect) {
          handleSelectOrder(orderToSelect); // This will also fetch its messages and customer
        } else {
          // If paramOrderId is provided but not found, clear selection or handle error
           const directFetchedOrder = await getOrderById(paramOrderId);
           if (directFetchedOrder) {
            handleSelectOrder(directFetchedOrder);
           } else {
             console.warn(`Order with ID ${paramOrderId} not found.`);
             setSelectedOrder(null);
             setSelectedOrderCustomer(null);
             setChatMessages([]);
           }
        }
      }
    } catch (error) {
      console.error("Failed to fetch orders for chat:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [paramOrderId]); // handleSelectOrder removed from deps to avoid re-fetch loop potential

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatMessages]);

  const handleSelectOrder = useCallback(async (order: Order) => {
    setSelectedOrder(order);
    setIsLoadingMessages(true);
    setSelectedOrderCustomer(null); // Reset customer info while loading
    try {
      const messages = await getChatMessagesForOrder(order.id);
      setChatMessages(messages);
      const customer = await getUserById(order.userId); // Fetch customer details
      setSelectedOrderCustomer(customer || null);
       // Update URL if not already matching, to allow direct linking
      if (paramOrderId !== order.id) {
        navigate(`/admin/chat/${order.id}`, { replace: true });
      }
    } catch (error) {
      console.error("Failed to fetch messages or customer for order:", order.id, error);
      setChatMessages([]);
      setSelectedOrderCustomer(null);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [navigate, paramOrderId]);

  const handleSendMessage = async (text?: string, file?: File) => {
    if (!selectedOrder || (!text && !file)) return;
    setIsSendingMessage(true);
    try {
      const newMessage = await sendChatMessage(selectedOrder.id, adminUserName, adminUserId, text, file);
      if (newMessage) {
        setChatMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Potentially show error to user in UI
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/admin')} className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors">
          <ArrowLeftIcon className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold metallic-gold-text">Chat dengan Pelanggan</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-10rem-5rem)]"> {/* Adjust height as needed */}
        {/* Orders List */}
        <Card title="Pilih Pesanan untuk Chat" className="bg-gray-800 md:col-span-1 overflow-y-auto">
          {isLoadingOrders ? (
            <LoadingSpinner />
          ) : orders.length === 0 ? (
            <p className="text-gray-400">Tidak ada pesanan.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map(order => (
                <li key={order.id}>
                  <Button
                    variant={selectedOrder?.id === order.id ? "primary" : "outline"}
                    fullWidth
                    onClick={() => handleSelectOrder(order)}
                    className="text-left justify-start !py-2 !px-3"
                  >
                    ID: {order.id.substring(0, 8)}... ({order.serviceType}) <br/>
                    <span className="text-xs opacity-70"> Pemesan: {(order.data as any).customerName}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Chat Window */}
        <Card 
            title={selectedOrder ? `Chat untuk Pesanan ID: ${selectedOrder.id.substring(0,8)}... (Pelanggan: ${selectedOrderCustomer?.name || selectedOrder.userId})` : "Pilih Pesanan"} 
            className="bg-gray-800 md:col-span-2 flex flex-col h-full"
        >
          {selectedOrder ? (
            <>
              <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-900 rounded-t-md">
                {isLoadingMessages ? (
                  <LoadingSpinner />
                ) : chatMessages.length === 0 ? (
                  <p className="text-gray-400 text-center py-10">Belum ada pesan. Mulai percakapan!</p>
                ) : (
                  chatMessages.map(msg => (
                    <ChatMessageBubble key={msg.id} message={msg} currentUserId={adminUserId} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              <ChatInput onSendMessage={handleSendMessage} isLoading={isSendingMessage} />
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-500">Pilih pesanan dari daftar di samping untuk memulai chat.</p>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default AdminChatPage;
