
import React from 'react';
import { Order, OrderStatus, ServiceType, HotelBookingData, VisaBookingData, HandlingBookingData, JastipBookingData } from '../types';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';

interface OrderItemCardProps {
  order: Order;
  isAdminView?: boolean;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
  onCustomerConfirm?: (orderId: string, confirmed: boolean) => void;
}

const getOrderStatusColor = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.REQUEST_CONFIRMATION: return 'bg-blue-600';
    case OrderStatus.TENTATIVE_CONFIRMATION: return 'bg-yellow-600';
    case OrderStatus.DEFINITE_CONFIRMATION: return 'bg-orange-600';
    case OrderStatus.CONFIRMED_BY_ADMIN: return 'bg-teal-600';
    case OrderStatus.DOWNPAYMENT_RECEIVED: return 'bg-indigo-600';
    case OrderStatus.FULLY_PAID: return 'bg-green-600';
    case OrderStatus.REJECTED_BY_CUSTOMER:
    case OrderStatus.CANCELLED: return 'bg-red-600';
    default: return 'bg-gray-500';
  }
};

const getOrderSummary = (order: Order): string => {
    switch (order.serviceType) {
        case ServiceType.HOTEL:
            const hotelData = order.data as HotelBookingData;
            const madinahInfo = hotelData.madinahHotel ? `Madinah: ${hotelData.madinahHotel.name}` : '';
            const makkahInfo = hotelData.makkahHotel ? `Makkah: ${hotelData.makkahHotel.name}` : '';
            return [madinahInfo, makkahInfo].filter(Boolean).join(' & ') || 'Detail Hotel';
        case ServiceType.VISA:
            return `Visa untuk ${(order.data as VisaBookingData).pax} jemaah`;
        case ServiceType.HANDLING:
            return `Handling untuk ${(order.data as HandlingBookingData).pax} jemaah`;
        case ServiceType.JASTIP:
            const jastipData = order.data as JastipBookingData;
            return `Jastip: ${jastipData.quantity} ${jastipData.unit} ${jastipData.itemType}`;
        default:
            return 'Detail Pesanan';
    }
};

export const OrderItemCard: React.FC<OrderItemCardProps> = ({ order, isAdminView = false, onStatusChange, onCustomerConfirm }) => {
  const detailPath = isAdminView ? `/admin/orders/${order.id}` : `/orders/${order.id}`;

  return (
    <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden transition-all hover:shadow-xl">
      <div className={`p-3 ${getOrderStatusColor(order.status)} text-white flex justify-between items-center`}>
        <h3 className="font-semibold">{order.serviceType} - Order ID: {order.id.substring(0, 8)}...</h3>
        <span className="text-sm px-2 py-0.5 rounded-full bg-black bg-opacity-20">{order.status}</span>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-gray-300"><span className="font-medium text-gray-100">Tanggal Pesan:</span> {new Date(order.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p className="text-gray-300"><span className="font-medium text-gray-100">Pemesan:</span> {(order.data as any).customerName}</p>
        <p className="text-gray-300"><span className="font-medium text-gray-100">Ringkasan:</span> {getOrderSummary(order)}</p>
        
        {order.status === OrderStatus.TENTATIVE_CONFIRMATION && !isAdminView && onCustomerConfirm && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-yellow-400 text-sm mb-2">Pesanan ini memerlukan konfirmasi Anda.</p>
            <div className="flex space-x-2">
              <Button size="sm" variant="primary" onClick={() => onCustomerConfirm(order.id, true)}>Konfirmasi Pesanan</Button>
              <Button size="sm" variant="danger" onClick={() => onCustomerConfirm(order.id, false)}>Tolak Pesanan</Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Link to={detailPath}>
            <Button variant="outline" size="sm">Lihat Detail</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
