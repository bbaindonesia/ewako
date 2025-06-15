
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../../components/Layout';
import { OrderItemCard } from '../../components/OrderItemCard';
import { Order, OrderStatus, ServiceType } from '../../types';
import { getAllOrders, updateOrderStatus } from '../../services/orderService'; // Updated import
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Select } from '../../components/ui/Select';
import { sendNotificationToCustomer } from '../../services/whatsappService';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { ApiErrorResponse } from '../../services/api';


const statusOptions = Object.values(OrderStatus).map(status => ({ value: status, label: status }));
const serviceTypeOptions = [{value: "", label: "Semua Layanan"}, ...Object.values(ServiceType).map(type => ({ value: type, label: type }))];

const AdminManageOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [serviceFilter, setServiceFilter] = useState<ServiceType | ''>('');


  const fetchAllOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allOrders = await getAllOrders();
      setOrders(allOrders);
      setFilteredOrders(allOrders); 
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError.message || "Gagal memuat pesanan. Silakan coba lagi.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  useEffect(() => {
    let currentOrders = [...orders];
    if (statusFilter) {
        currentOrders = currentOrders.filter(o => o.status === statusFilter);
    }
    if (serviceFilter) {
        currentOrders = currentOrders.filter(o => o.serviceType === serviceFilter);
    }
    setFilteredOrders(currentOrders);
  }, [statusFilter, serviceFilter, orders]);


  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setIsLoading(true); 
    setError(null);
    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus);
      
      if(updatedOrder) {
        const customerPhone = (updatedOrder.data as any).phone;
        let messageToCustomer = `Status pesanan Anda (${updatedOrder.serviceType} - ID: ${orderId.substring(0,8)}) telah diperbarui menjadi: ${newStatus}.`;
        
        if (newStatus === OrderStatus.DEFINITE_CONFIRMATION) {
             messageToCustomer += " Berikut adalah detail tagihan dan instruksi pembayaran Down Payment (DP). (Detail akan dikirim terpisah)";
        } else if (newStatus === OrderStatus.DOWNPAYMENT_RECEIVED) {
            messageToCustomer = `Pembayaran DP Anda untuk pesanan (${updatedOrder.serviceType} - ID: ${orderId.substring(0,8)}) telah kami terima. Terima kasih.`;
        } else if (newStatus === OrderStatus.FULLY_PAID) {
            messageToCustomer = `Pembayaran Anda untuk pesanan (${updatedOrder.serviceType} - ID: ${orderId.substring(0,8)}) telah lunas. Itinerary dan dokumen akan segera kami kirimkan. Terima kasih telah menggunakan layanan EWAKO ROYAL.`;
        } else if (newStatus === OrderStatus.CONFIRMED_BY_ADMIN){
             messageToCustomer += " Pesanan Anda telah dikonfirmasi oleh Admin. Silakan lanjutkan ke tahap berikutnya.";
        }

        if (customerPhone) sendNotificationToCustomer(customerPhone, messageToCustomer);
        await fetchAllOrders(); // Re-fetch all orders to reflect changes
      } else {
        throw new Error("Failed to update order status from API.");
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
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/admin')} className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors">
            <ArrowLeftIcon className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-3xl font-bold metallic-gold-text">Kelola Semua Pesanan</h1>
      </div>

      <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-md flex flex-col md:flex-row gap-4 items-center">
        <Select
            label="Filter Status:"
            options={[{ value: '', label: 'Semua Status' }, ...statusOptions]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            className="w-full md:w-auto"
        />
        <Select
            label="Filter Layanan:"
            options={serviceTypeOptions}
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value as ServiceType | '')}
            className="w-full md:w-auto"
        />
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <p className="text-red-400 bg-red-900 p-3 rounded-md">{error}</p>}
      {!isLoading && !error && filteredOrders.length === 0 && (
        <p className="text-gray-400">Tidak ada pesanan yang cocok dengan filter saat ini atau belum ada pesanan.</p>
      )}
      {!isLoading && !error && filteredOrders.length > 0 && (
        <div className="space-y-6">
          {filteredOrders.map(order => (
            <OrderItemCard 
              key={order.id} 
              order={order} 
              isAdminView={true}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default AdminManageOrdersPage;
