
import { Order, OrderStatus, ServiceType, HotelBookingData, VisaBookingData, HandlingBookingData, JastipBookingData, PackageInfoData, ManifestItem, Payment, ChatMessage, HotelInfo, RoomBooking } from '../types';
import { convertToIDR } from './currencyService'; // Import currency converter

const ORDERS_STORAGE_KEY = 'ewakoRoyalOrders';

const getStoredOrders = (): Order[] => {
  const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsedData = JSON.parse(stored);
    if (!Array.isArray(parsedData)) {
      console.warn(`Data in localStorage for ${ORDERS_STORAGE_KEY} is not an array. Clearing and returning empty.`);
      localStorage.removeItem(ORDERS_STORAGE_KEY);
      return [];
    }
    return parsedData as Order[];
  } catch (error) {
    console.error(`Error parsing orders from localStorage (key: ${ORDERS_STORAGE_KEY}). Clearing and returning empty.`, error);
    try {
      localStorage.removeItem(ORDERS_STORAGE_KEY);
    } catch (removeError) {
      console.error(`Failed to remove corrupted item ${ORDERS_STORAGE_KEY} from localStorage:`, removeError);
    }
    return [];
  }
};

const saveStoredOrders = (orders: Order[]) => {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
};

// Initialize with some mock data if empty
if (getStoredOrders().length === 0) {
    const initialMockOrders: Order[] = [
        {
            id: 'mock1',
            userId: 'customer1',
            serviceType: ServiceType.HOTEL,
            data: {
                customerName: "Ahmad Subarjo",
                ppiuName: "Barokah Travel",
                phone: "+6281234567890",
                address: "Jl. Merdeka No. 10, Jakarta",
                madinahHotel: { name: "Anwar Al Madinah Mövenpick", nights: 3, rooms: { quad: 1, triple: 0, double: 0 }, checkIn: "2024-09-01", checkOut: "2024-09-04", pricesSAR: {} },
                makkahHotel: { name: "Fairmont Makkah Clock Royal Tower", nights: 4, rooms: { quad: 1, triple: 0, double: 0 }, checkIn: "2024-09-04", checkOut: "2024-09-08", pricesSAR: {} },
                includeHandling: true, handlingPax: 4,
                includeVisa: true, visaPax: 4,
            } as HotelBookingData,
            status: OrderStatus.REQUEST_CONFIRMATION,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            manifest: [],
            payments: [],
            chatHistory: [],
        },
    ];
    saveStoredOrders(initialMockOrders);
}


export const createOrder = async (
  userId: string,
  serviceType: ServiceType,
  data: HotelBookingData | VisaBookingData | HandlingBookingData | JastipBookingData
): Promise<Order> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const orders = getStoredOrders();
      const newOrder: Order = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        serviceType,
        data,
        status: OrderStatus.REQUEST_CONFIRMATION,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        manifest: [], 
        payments: [],
        chatHistory: [],
      };
      orders.push(newOrder);
      saveStoredOrders(orders);
      resolve(newOrder);
    }, 500);
  });
};

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const orders = getStoredOrders();
            resolve(orders.filter(order => order.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }, 300);
    });
};

export const getAllOrders = async (): Promise<Order[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(getStoredOrders().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }, 300);
    });
};

export const getOrderById = async (orderId: string): Promise<Order | undefined> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const orders = getStoredOrders();
            resolve(orders.find(order => order.id === orderId));
        }, 300);
    });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus, customerConfirmation?: boolean): Promise<Order | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let orders = getStoredOrders();
      const orderIndex = orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].status = status;
        orders[orderIndex].updatedAt = new Date().toISOString();
        if (customerConfirmation !== undefined) {
          orders[orderIndex].customerConfirmation = customerConfirmation;
        }
        saveStoredOrders(orders);
        resolve(orders[orderIndex]);
      } else {
        resolve(undefined);
      }
    }, 300);
  });
};

export const updateOrderData = async (orderId: string, data: Partial<HotelBookingData> | Partial<VisaBookingData> | Partial<HandlingBookingData> | Partial<JastipBookingData>): Promise<Order | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let orders = getStoredOrders();
      const orderIndex = orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].data = { ...orders[orderIndex].data, ...data } as any; 
        orders[orderIndex].updatedAt = new Date().toISOString();
        saveStoredOrders(orders);
        resolve(orders[orderIndex]);
      } else {
        resolve(undefined);
      }
    }, 300);
  });
};

export const updatePackageInfo = async (orderId: string, packageInfo: PackageInfoData): Promise<Order | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let orders = getStoredOrders();
      const orderIndex = orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].packageInfo = packageInfo;
        orders[orderIndex].updatedAt = new Date().toISOString();
        saveStoredOrders(orders);
        resolve(orders[orderIndex]);
      } else {
        resolve(undefined);
      }
    }, 300);
  });
};

export const updateOrderManifest = async (orderId: string, manifest: ManifestItem[]): Promise<Order | undefined> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let orders = getStoredOrders();
            const orderIndex = orders.findIndex(order => order.id === orderId);
            if (orderIndex !== -1) {
                orders[orderIndex].manifest = manifest;
                orders[orderIndex].updatedAt = new Date().toISOString();
                saveStoredOrders(orders);
                resolve(orders[orderIndex]);
            } else {
                resolve(undefined);
            }
        }, 300);
    });
};

export const addPaymentToOrder = async (orderId: string, paymentData: Omit<Payment, 'id' | 'createdAt' | 'orderId'>): Promise<Order | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let orders = getStoredOrders();
      const orderIndex = orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        const newPayment: Payment = {
          ...paymentData,
          id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          orderId: orderId,
          createdAt: new Date().toISOString(),
        };
        if (!orders[orderIndex].payments) {
          orders[orderIndex].payments = [];
        }
        orders[orderIndex].payments!.push(newPayment);
        orders[orderIndex].updatedAt = new Date().toISOString();
        saveStoredOrders(orders);
        resolve(orders[orderIndex]);
      } else {
        resolve(undefined);
      }
    }, 300);
  });
};

export const deletePaymentFromOrder = async (orderId: string, paymentId: string): Promise<Order | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let orders = getStoredOrders();
      const orderIndex = orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1 && orders[orderIndex].payments) {
        orders[orderIndex].payments = orders[orderIndex].payments!.filter(p => p.id !== paymentId);
        orders[orderIndex].updatedAt = new Date().toISOString();
        saveStoredOrders(orders);
        resolve(orders[orderIndex]);
      } else {
        resolve(undefined);
      }
    }, 300);
  });
};

export const updateOrderChatHistory = async (orderId: string, chatHistory: ChatMessage[]): Promise<Order | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let orders = getStoredOrders();
      const orderIndex = orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].chatHistory = chatHistory;
        orders[orderIndex].updatedAt = new Date().toISOString();
        saveStoredOrders(orders);
        resolve(orders[orderIndex]);
      } else {
        resolve(undefined);
      }
    }, 300);
  });
};

interface AdminPriceDetailsInput {
  madinahHotelRoomPricesSAR?: { quad?: number; triple?: number; double?: number };
  makkahHotelRoomPricesSAR?: { quad?: number; triple?: number; double?: number };
  visaPricePerPaxUSD?: number;
  handlingPricePerPaxSAR?: number;
  busPriceTotalSAR?: number;
  muasasahName?: string;
}

export const adminSetPriceAndDetails = async (
  orderId: string,
  details: AdminPriceDetailsInput
): Promise<Order | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let orders = getStoredOrders();
      const orderIndex = orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        const order = orders[orderIndex];
        let calculatedTotalPriceIDR = 0;

        if (order.serviceType === ServiceType.HOTEL) {
          const hotelData = order.data as HotelBookingData;
          
          if (hotelData.madinahHotel) {
            if (!hotelData.madinahHotel.pricesSAR) hotelData.madinahHotel.pricesSAR = {};
            if (details.madinahHotelRoomPricesSAR?.quad !== undefined) {
                hotelData.madinahHotel.pricesSAR.quad = details.madinahHotelRoomPricesSAR.quad;
                if (hotelData.madinahHotel.rooms.quad > 0) {
                    calculatedTotalPriceIDR += convertToIDR(hotelData.madinahHotel.pricesSAR.quad * hotelData.madinahHotel.nights * hotelData.madinahHotel.rooms.quad, 'SAR');
                }
            }
            if (details.madinahHotelRoomPricesSAR?.triple !== undefined) {
                hotelData.madinahHotel.pricesSAR.triple = details.madinahHotelRoomPricesSAR.triple;
                 if (hotelData.madinahHotel.rooms.triple > 0) {
                    calculatedTotalPriceIDR += convertToIDR(hotelData.madinahHotel.pricesSAR.triple * hotelData.madinahHotel.nights * hotelData.madinahHotel.rooms.triple, 'SAR');
                }
            }
            if (details.madinahHotelRoomPricesSAR?.double !== undefined) {
                hotelData.madinahHotel.pricesSAR.double = details.madinahHotelRoomPricesSAR.double;
                if (hotelData.madinahHotel.rooms.double > 0) {
                    calculatedTotalPriceIDR += convertToIDR(hotelData.madinahHotel.pricesSAR.double * hotelData.madinahHotel.nights * hotelData.madinahHotel.rooms.double, 'SAR');
                }
            }
          }

          if (hotelData.makkahHotel) {
            if (!hotelData.makkahHotel.pricesSAR) hotelData.makkahHotel.pricesSAR = {};
             if (details.makkahHotelRoomPricesSAR?.quad !== undefined) {
                hotelData.makkahHotel.pricesSAR.quad = details.makkahHotelRoomPricesSAR.quad;
                if (hotelData.makkahHotel.rooms.quad > 0) {
                    calculatedTotalPriceIDR += convertToIDR(hotelData.makkahHotel.pricesSAR.quad * hotelData.makkahHotel.nights * hotelData.makkahHotel.rooms.quad, 'SAR');
                }
            }
            if (details.makkahHotelRoomPricesSAR?.triple !== undefined) {
                hotelData.makkahHotel.pricesSAR.triple = details.makkahHotelRoomPricesSAR.triple;
                if (hotelData.makkahHotel.rooms.triple > 0) {
                    calculatedTotalPriceIDR += convertToIDR(hotelData.makkahHotel.pricesSAR.triple * hotelData.makkahHotel.nights * hotelData.makkahHotel.rooms.triple, 'SAR');
                }
            }
            if (details.makkahHotelRoomPricesSAR?.double !== undefined) {
                hotelData.makkahHotel.pricesSAR.double = details.makkahHotelRoomPricesSAR.double;
                if (hotelData.makkahHotel.rooms.double > 0) {
                    calculatedTotalPriceIDR += convertToIDR(hotelData.makkahHotel.pricesSAR.double * hotelData.makkahHotel.nights * hotelData.makkahHotel.rooms.double, 'SAR');
                }
            }
          }

          if (hotelData.includeVisa && details.visaPricePerPaxUSD !== undefined && hotelData.visaPax) {
            hotelData.visaPricePerPaxUSD = details.visaPricePerPaxUSD;
            calculatedTotalPriceIDR += convertToIDR(hotelData.visaPricePerPaxUSD * hotelData.visaPax, 'USD');
          }
          if (hotelData.includeHandling && details.handlingPricePerPaxSAR !== undefined && hotelData.handlingPax) {
            hotelData.handlingPricePerPaxSAR = details.handlingPricePerPaxSAR;
            calculatedTotalPriceIDR += convertToIDR(hotelData.handlingPricePerPaxSAR * hotelData.handlingPax, 'SAR');
          }
           if (details.busPriceTotalSAR !== undefined) {
            hotelData.busPriceTotalSAR = details.busPriceTotalSAR;
            calculatedTotalPriceIDR += convertToIDR(hotelData.busPriceTotalSAR, 'SAR');
          }
          if (details.muasasahName !== undefined) {
            hotelData.muasasahName = details.muasasahName;
          }
        } else if (order.serviceType === ServiceType.VISA) {
          const visaData = order.data as VisaBookingData;
          if (details.visaPricePerPaxUSD !== undefined && visaData.pax) {
            visaData.visaPricePerPaxUSD = details.visaPricePerPaxUSD;
            calculatedTotalPriceIDR += convertToIDR(visaData.visaPricePerPaxUSD * visaData.pax, 'USD');
          }
          if (details.busPriceTotalSAR !== undefined) {
            visaData.busPriceTotalSAR = details.busPriceTotalSAR;
            calculatedTotalPriceIDR += convertToIDR(visaData.busPriceTotalSAR, 'SAR');
          }
          if (details.muasasahName !== undefined) {
            visaData.muasasahName = details.muasasahName;
          }
        } else if (order.serviceType === ServiceType.HANDLING) {
          const handlingData = order.data as HandlingBookingData;
          if (details.handlingPricePerPaxSAR !== undefined && handlingData.pax) {
            handlingData.handlingPricePerPaxSAR = details.handlingPricePerPaxSAR;
            calculatedTotalPriceIDR += convertToIDR(handlingData.handlingPricePerPaxSAR * handlingData.pax, 'SAR');
          }
        }
        // Jastip pricing is typically managed differently, not part of this LA multi-currency setup.
        
        orders[orderIndex].totalPrice = Math.round(calculatedTotalPriceIDR); // Store total in IDR
        orders[orderIndex].updatedAt = new Date().toISOString();
        
        if (orders[orderIndex].status === OrderStatus.REQUEST_CONFIRMATION && calculatedTotalPriceIDR > 0) {
             orders[orderIndex].status = OrderStatus.TENTATIVE_CONFIRMATION;
        }
        saveStoredOrders(orders);
        resolve(orders[orderIndex]);
      } else {
        resolve(undefined);
      }
    }, 300);
  });
};
