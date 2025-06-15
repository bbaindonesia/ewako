import { Order, OrderStatus, ServiceType, HotelBookingData, VisaBookingData, HandlingBookingData, JastipBookingData, PackageInfoData, ManifestItem, Payment, ChatMessage } from '../types';
import fetchApi from './api';

export const createOrder = async (
  userId: string,
  serviceType: ServiceType,
  data: HotelBookingData | VisaBookingData | HandlingBookingData | JastipBookingData
): Promise<Order> => {
  return fetchApi<Order>('/orders', {
    method: 'POST',
    body: { userId, serviceType, data },
  });
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
  return fetchApi<Order[]>(`/orders?userId=${userId}`);
};

export const getAllOrders = async (): Promise<Order[]> => {
  return fetchApi<Order[]>('/orders');
};

export const getOrderById = async (orderId: string): Promise<Order | undefined> => {
  return fetchApi<Order | undefined>(`/orders/${orderId}`);
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus, customerConfirmation?: boolean): Promise<Order | undefined> => {
  return fetchApi<Order | undefined>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: { status, customerConfirmation },
  });
};

export const updateOrderData = async (orderId: string, data: Partial<HotelBookingData> | Partial<VisaBookingData> | Partial<HandlingBookingData> | Partial<JastipBookingData>): Promise<Order | undefined> => {
  return fetchApi<Order | undefined>(`/orders/${orderId}`, { // Assuming PUT updates the main data
    method: 'PUT',
    body: { data }, // Send within a 'data' object or directly depending on backend
  });
};

export const updatePackageInfo = async (orderId: string, packageInfo: PackageInfoData): Promise<Order | undefined> => {
  return fetchApi<Order | undefined>(`/orders/${orderId}/package-info`, {
    method: 'PUT',
    body: packageInfo,
  });
};

export const updateOrderManifest = async (orderId: string, manifest: ManifestItem[]): Promise<Order | undefined> => {
  return fetchApi<Order | undefined>(`/orders/${orderId}/manifest`, {
    method: 'PUT',
    body: manifest,
  });
};

export const addPaymentToOrder = async (orderId: string, paymentData: Omit<Payment, 'id' | 'createdAt' | 'orderId'>): Promise<Order | undefined> => {
  return fetchApi<Order | undefined>(`/orders/${orderId}/payments`, {
    method: 'POST',
    body: paymentData,
  });
};

export const deletePaymentFromOrder = async (orderId: string, paymentId: string): Promise<Order | undefined> => {
  return fetchApi<Order | undefined>(`/orders/${orderId}/payments/${paymentId}`, {
    method: 'DELETE',
  });
};

export const adminSetPriceAndDetails = async (
  orderId: string,
  details: {
    madinahHotelRoomPricesSAR?: { quad?: number; triple?: number; double?: number };
    makkahHotelRoomPricesSAR?: { quad?: number; triple?: number; double?: number };
    visaPricePerPaxUSD?: number;
    handlingPricePerPaxSAR?: number;
    busPriceTotalSAR?: number;
    muasasahName?: string;
  }
): Promise<Order | undefined> => {
  return fetchApi<Order | undefined>(`/orders/${orderId}/admin-pricing`, {
    method: 'POST', // Or PUT, depending on backend design
    body: details,
  });
};

// updateOrderChatHistory is removed as chat messages will be managed via chatService.
// If chat history is part of the Order object from GET /orders/:orderId, it will be updated automatically.
