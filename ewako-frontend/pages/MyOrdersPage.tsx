
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { OrderItemCard } from '../components/OrderItemCard';
import { Order, OrderStatus } from '../types';
import { getOrdersByUserId, updateOrderStatus } from '../services/orderService'; // Updated import
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { sendNotificationToCustomer } from '../services/whatsappService';
import { ADMIN_WHATSAPP_NUMBER } from '../constants';
import { useAuth } from '../App'; // Import useAuth
import { ApiErrorResponse } from '../services/api';

const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, isAuthenticated } = useAuth(); // Get userId and auth status

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (!userId || !isAuthenticated) {
      setIsLoading(false);
      if (!isAuthenticated) setError("Silakan login untuk melihat pesanan Anda.");
      else setError("User ID tidak ditemukan.");
      setOrders([]);
      return;
    }
    if(showLoading) setIsLoading(true);
    setError(null);
    try {
      const userOrders = await getOrdersByUserId(userId);
      setOrders(userOrders);
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError.message || "Gagal memuat pesanan. Silakan coba lagi.");
      console.error(err);
    } finally {
      if(showLoading) setIsLoading(false);
    }
  }, [userId, isAuthenticated]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const handleFocus = () => {
      console.log('MyOrdersPage gained focus, refetching orders.');
      fetchOrders(false); 
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchOrders]);


  const handleCustomerConfirmation = async (orderId: string, confirmed: boolean) => {
    setIsLoading(true); // Consider more granular loading
    setError(null);
    try {
      const newStatus = confirmed ? OrderStatus.DEFINITE_CONFIRMATION : OrderStatus.REJECTED_BY_CUSTOMER;
      const updatedOrder = await updateOrderStatus(orderId, newStatus, confirmed);
      
      if(updatedOrder) {
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
        
        const customerPhone = (updatedOrder.data as any).phone;
        const messageToCustomer = confirmed 
          ? `Pesanan Anda (${updatedOrder.serviceType} - ID: ${orderId.substring(0,8)}) telah Anda konfirmasi. Kami akan segera memprosesnya.`
          : `Anda telah menolak pesanan (${updatedOrder.serviceType} - ID: ${orderId.substring(0,8)}). Jika ada pertanyaan, silakan hubungi kami.`;
        if (customerPhone) sendNotificationToCustomer(customerPhone, messageToCustomer);
        
        const messageToAdmin = `Pelanggan ${(updatedOrder.data as any).customerName} (${customerPhone}) telah ${confirmed ? 'MENGKONFIRMASI' : 'MENOLAK'} pesanan ${updatedOrder.serviceType} (ID: ${orderId.substring(0,8)}).`;
        sendNotificationToCustomer(ADMIN_WHATSAPP_NUMBER.replace('+', ''), messageToAdmin);
      }
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError.message || "Gagal memperbarui status pesanan.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold metallic-gold-text mb-8">Pesanan Saya</h1>
      {isLoading && orders.length === 0 && <LoadingSpinner />}
      {error && <p className="text-red-400 bg-red-900 p-3 rounded-md">{error}</p>}
      {!isLoading && !error && orders.length === 0 && (
        <p className="text-gray-400">{isAuthenticated ? "Anda belum memiliki pesanan." : "Silakan login untuk melihat pesanan."}</p>
      )}
      {!error && orders.length > 0 && (
        <div className="space-y-6">
          {orders.map(order => (
            <OrderItemCard 
              key={order.id} 
              order={order} 
              onCustomerConfirm={handleCustomerConfirmation} 
            />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default MyOrdersPage;
