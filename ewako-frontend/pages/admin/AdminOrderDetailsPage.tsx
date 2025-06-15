
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Order, OrderStatus, HotelBookingData, VisaBookingData, HandlingBookingData, JastipBookingData, ServiceType, PackageInfoData, HotelInfo, ManifestItem, Payment, RoomBooking, Vehicle, BusRouteItem } from '../../types';
import { getOrderById, updateOrderStatus, updatePackageInfo, addPaymentToOrder, deletePaymentFromOrder, adminSetPriceAndDetails } from '../../services/orderService'; // Updated
import { getVehicles } from '../../services/vehicleService'; // Updated
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PackageInfoDisplay } from '../../components/PackageInfoDisplay';
import { sendNotificationToCustomer } from '../../services/whatsappService';
import { generateOrderRequestPdf, generateInvoicePdf, generatePackageInfoPdf } from '../../services/pdfService';
import { MOCK_MUTOWIFS, ADMIN_WHATSAPP_NUMBER } from '../../constants';
import { Input } from '../../components/ui/Input'; 
import { MOCK_EXCHANGE_RATES, convertToIDR, formatCurrency } from '../../services/currencyService';
import { ApiErrorResponse } from '../../services/api';

const statusOptions = Object.values(OrderStatus).map(status => ({ value: status, label: status }));

const paymentTypeOptions = [
    { value: 'DP', label: 'DP (Down Payment)' },
    { value: 'LUNAS', label: 'Pelunasan' },
    { value: 'LAINNYA', label: 'Lainnya' },
];
const paymentMethodOptions = [
    { value: 'Transfer', label: 'Transfer Bank' },
    { value: 'Midtrans VA', label: 'Midtrans Virtual Account' },
    { value: 'Cash', label: 'Tunai (Cash)' },
    { value: 'Lainnya', label: 'Lainnya' },
];

const formatDateForDisplay = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString.split('T')[0]); 
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTimeForDisplay = (dateTimeString?: string): string => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'});
};

const formatHotelToStringForPackageInfo = (hotel?: HotelInfo): string => {
    if (!hotel || !hotel.name) return '';
    const roomsDescArray: string[] = [];
    if (hotel.rooms.quad > 0) roomsDescArray.push(`Quad(${hotel.rooms.quad})`);
    if (hotel.rooms.triple > 0) roomsDescArray.push(`Triple(${hotel.rooms.triple})`);
    if (hotel.rooms.double > 0) roomsDescArray.push(`Double(${hotel.rooms.double})`);
    const roomsDesc = roomsDescArray.length > 0 ? roomsDescArray.join(', ') : 'Rincian kamar tidak specific';
    
    return `${hotel.name} (Kamar: ${roomsDesc}), ${hotel.nights} malam. CheckIn: ${formatDateForDisplay(hotel.checkIn)}, CheckOut: ${formatDateForDisplay(hotel.checkOut)}`;
};

const initialPackageInfo: PackageInfoData = {
    ppiuName: '', ppiuPhone: '', paxCount: 0, madinahHotelInfo: '', makkahHotelInfo: '',
    busVehicleId: '', busName: '', busVehicleType: '', busDriverName: '', busDriverPhone: '', busSyarikahNumber: '',
    busRoutes: [], mutowifName: '', mutowifPhone: '',
    representativeName: '', representativePhone: '', ewakoRoyalPhone: ADMIN_WHATSAPP_NUMBER.replace('+', ''),
    airlineName: '', airlineCode: '', arrivalDateTime: '', departureDateTime: '',
};

const initialPaymentForm: Omit<Payment, 'id' | 'createdAt' | 'orderId'> = {
    userId: 'adminUser', 
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentType: 'DP',
    paymentMethod: 'Transfer',
    notes: ''
};

interface AdminPriceInputState {
  madinahHotelRoomPricesSAR: { quad: string; triple: string; double: string };
  makkahHotelRoomPricesSAR: { quad: string; triple: string; double: string };
  visaPricePerPaxUSD: string;
  handlingPricePerPaxSAR: string;
  busPriceTotalSAR: string;
  muasasahName: string;
}

const initialAdminPriceInputState: AdminPriceInputState = {
  madinahHotelRoomPricesSAR: { quad: '', triple: '', double: '' },
  makkahHotelRoomPricesSAR: { quad: '', triple: '', double: '' },
  visaPricePerPaxUSD: '',
  handlingPricePerPaxSAR: '',
  busPriceTotalSAR: '',
  muasasahName: '',
};

interface CalculatedSubTotalsState {
    madinahHotel: { subtotalSAR: { quad: number; triple: number; double: number; total: number }; subtotalIDR: { quad: number; triple: number; double: number; total: number } };
    makkahHotel: { subtotalSAR: { quad: number; triple: number; double: number; total: number }; subtotalIDR: { quad: number; triple: number; double: number; total: number } };
    visa: { amountUSD: number; amountIDR: number };
    handling: { amountSAR: number; amountIDR: number };
    bus: { amountSAR: number; amountIDR: number };
    summary: { totalSAR: number; totalUSD: number; grandTotalIDR: number };
}

const initialCalculatedSubTotals: CalculatedSubTotalsState = {
    madinahHotel: { subtotalSAR: { quad: 0, triple: 0, double: 0, total: 0 }, subtotalIDR: { quad: 0, triple: 0, double: 0, total: 0 } },
    makkahHotel: { subtotalSAR: { quad: 0, triple: 0, double: 0, total: 0 }, subtotalIDR: { quad: 0, triple: 0, double: 0, total: 0 } },
    visa: { amountUSD: 0, amountIDR: 0 },
    handling: { amountSAR: 0, amountIDR: 0 },
    bus: { amountSAR: 0, amountIDR: 0 },
    summary: { totalSAR: 0, totalUSD: 0, grandTotalIDR: 0 },
};


const AdminOrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  
  const [isEditingPackageInfo, setIsEditingPackageInfo] = useState(false);
  const [packageInfoForm, setPackageInfoForm] = useState<PackageInfoData>(initialPackageInfo);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);

  const [adminPriceInputs, setAdminPriceInputs] = useState<AdminPriceInputState>(initialAdminPriceInputState);
  const [calculatedSubTotals, setCalculatedSubTotals] = useState<CalculatedSubTotalsState>(initialCalculatedSubTotals);

  const fetchOrderDetails = useCallback(async (showLoadingSpinner = true) => {
    if (!orderId) { 
        setError("Order ID tidak valid.");
        setIsLoading(false);
        return; 
    }
    if (showLoadingSpinner) setIsLoading(true); setError(null);
    try {
      const fetchedOrder = await getOrderById(orderId);
      const vehicles = await getVehicles();
      setAvailableVehicles(vehicles);

      if (fetchedOrder) {
        setOrder(fetchedOrder);
        setSelectedStatus(fetchedOrder.status);
        
        let initialFormState = { ...initialPackageInfo, ...(fetchedOrder.packageInfo || {}) };
        if (fetchedOrder.packageInfo?.busVehicleId) {
            const selectedVehicle = vehicles.find(v => v.id === fetchedOrder.packageInfo?.busVehicleId);
            if (selectedVehicle) {
                initialFormState = {
                    ...initialFormState,
                    busVehicleId: selectedVehicle.id,
                    busName: selectedVehicle.name,
                    busVehicleType: selectedVehicle.type,
                    busDriverName: selectedVehicle.driverName || '',
                    busDriverPhone: selectedVehicle.driverPhone || '',
                };
            }
        }
        if (initialFormState.busRoutes && initialFormState.busRoutes.length > 0) {
            initialFormState.busRoutes = initialFormState.busRoutes.map(route => {
                if (route.routeVehicleId) {
                    const foundVehicle = vehicles.find(v => v.id === route.routeVehicleId);
                    if (foundVehicle) {
                        return {
                            ...route,
                            vehicleDetails: `${foundVehicle.name} (${foundVehicle.plateNumber}) - Driver: ${foundVehicle.driverName || '-'}`
                        };
                    }
                }
                return route;
            });
        }
        setPackageInfoForm(initialFormState);

        const data = fetchedOrder.data as HotelBookingData; 
        const newAdminPriceInputs = { ...initialAdminPriceInputState };
        if (data.madinahHotel?.pricesSAR) {
            newAdminPriceInputs.madinahHotelRoomPricesSAR.quad = data.madinahHotel.pricesSAR.quad?.toString() || '';
            newAdminPriceInputs.madinahHotelRoomPricesSAR.triple = data.madinahHotel.pricesSAR.triple?.toString() || '';
            newAdminPriceInputs.madinahHotelRoomPricesSAR.double = data.madinahHotel.pricesSAR.double?.toString() || '';
        }
        if (data.makkahHotel?.pricesSAR) {
            newAdminPriceInputs.makkahHotelRoomPricesSAR.quad = data.makkahHotel.pricesSAR.quad?.toString() || '';
            newAdminPriceInputs.makkahHotelRoomPricesSAR.triple = data.makkahHotel.pricesSAR.triple?.toString() || '';
            newAdminPriceInputs.makkahHotelRoomPricesSAR.double = data.makkahHotel.pricesSAR.double?.toString() || '';
        }
        newAdminPriceInputs.visaPricePerPaxUSD = data.visaPricePerPaxUSD?.toString() || '';
        newAdminPriceInputs.handlingPricePerPaxSAR = data.handlingPricePerPaxSAR?.toString() || '';
        newAdminPriceInputs.busPriceTotalSAR = data.busPriceTotalSAR?.toString() || '';
        newAdminPriceInputs.muasasahName = data.muasasahName || '';
        setAdminPriceInputs(newAdminPriceInputs);

      } else { setError("Pesanan tidak ditemukan."); }
    } catch (err) { 
        const apiError = err as ApiErrorResponse;
        setError(apiError.message || "Gagal memuat detail pesanan.");
        console.error(err);
    } finally { if (showLoadingSpinner) setIsLoading(false); }
  }, [orderId]);

  useEffect(() => { fetchOrderDetails(); }, [fetchOrderDetails]);
  
   useEffect(() => {
    if (!order) return;

    const data = order.data as any;
    const newSubTotals: CalculatedSubTotalsState = JSON.parse(JSON.stringify(initialCalculatedSubTotals));
    let currentTotalSAR = 0;
    let currentTotalUSD = 0;
    let currentGrandTotalIDR = 0;

    if (order.serviceType === ServiceType.HOTEL) {
        const hotelData = data as HotelBookingData;
        
        const calculateHotelSubtotals = (
            hotelInfo?: HotelInfo, 
            roomPricesSAR?: { quad: string; triple: string; double: string }
        ): { subtotalSAR: { quad: number; triple: number; double: number; total: number }; subtotalIDR: { quad: number; triple: number; double: number; total: number } } => {
            const result = { 
                subtotalSAR: { quad: 0, triple: 0, double: 0, total: 0 }, 
                subtotalIDR: { quad: 0, triple: 0, double: 0, total: 0 } 
            };
            if (!hotelInfo || !roomPricesSAR) return result;

            const priceQuadSAR = parseFloat(roomPricesSAR.quad) || 0;
            const priceTripleSAR = parseFloat(roomPricesSAR.triple) || 0;
            const priceDoubleSAR = parseFloat(roomPricesSAR.double) || 0;

            if (hotelInfo.rooms.quad > 0 && priceQuadSAR > 0) {
                result.subtotalSAR.quad = priceQuadSAR * hotelInfo.nights * hotelInfo.rooms.quad;
                result.subtotalIDR.quad = convertToIDR(result.subtotalSAR.quad, 'SAR');
            }
            if (hotelInfo.rooms.triple > 0 && priceTripleSAR > 0) {
                result.subtotalSAR.triple = priceTripleSAR * hotelInfo.nights * hotelInfo.rooms.triple;
                result.subtotalIDR.triple = convertToIDR(result.subtotalSAR.triple, 'SAR');
            }
            if (hotelInfo.rooms.double > 0 && priceDoubleSAR > 0) {
                result.subtotalSAR.double = priceDoubleSAR * hotelInfo.nights * hotelInfo.rooms.double;
                result.subtotalIDR.double = convertToIDR(result.subtotalSAR.double, 'SAR');
            }
            result.subtotalSAR.total = result.subtotalSAR.quad + result.subtotalSAR.triple + result.subtotalSAR.double;
            result.subtotalIDR.total = result.subtotalIDR.quad + result.subtotalIDR.triple + result.subtotalIDR.double;
            return result;
        };

        newSubTotals.madinahHotel = calculateHotelSubtotals(hotelData.madinahHotel, adminPriceInputs.madinahHotelRoomPricesSAR);
        currentTotalSAR += newSubTotals.madinahHotel.subtotalSAR.total;
        currentGrandTotalIDR += newSubTotals.madinahHotel.subtotalIDR.total;
        
        newSubTotals.makkahHotel = calculateHotelSubtotals(hotelData.makkahHotel, adminPriceInputs.makkahHotelRoomPricesSAR);
        currentTotalSAR += newSubTotals.makkahHotel.subtotalSAR.total;
        currentGrandTotalIDR += newSubTotals.makkahHotel.subtotalIDR.total;

        if (hotelData.includeVisa && hotelData.visaPax && parseFloat(adminPriceInputs.visaPricePerPaxUSD) > 0) {
            newSubTotals.visa.amountUSD = parseFloat(adminPriceInputs.visaPricePerPaxUSD) * hotelData.visaPax;
            newSubTotals.visa.amountIDR = convertToIDR(newSubTotals.visa.amountUSD, 'USD');
            currentTotalUSD += newSubTotals.visa.amountUSD;
            currentGrandTotalIDR += newSubTotals.visa.amountIDR;
        }
        if (hotelData.includeHandling && hotelData.handlingPax && parseFloat(adminPriceInputs.handlingPricePerPaxSAR) > 0) {
            newSubTotals.handling.amountSAR = parseFloat(adminPriceInputs.handlingPricePerPaxSAR) * hotelData.handlingPax;
            newSubTotals.handling.amountIDR = convertToIDR(newSubTotals.handling.amountSAR, 'SAR');
            currentTotalSAR += newSubTotals.handling.amountSAR;
            currentGrandTotalIDR += newSubTotals.handling.amountIDR;
        }
    } else if (order.serviceType === ServiceType.VISA) {
        const visaData = data as VisaBookingData;
        if (visaData.pax && parseFloat(adminPriceInputs.visaPricePerPaxUSD) > 0) {
            newSubTotals.visa.amountUSD = parseFloat(adminPriceInputs.visaPricePerPaxUSD) * visaData.pax;
            newSubTotals.visa.amountIDR = convertToIDR(newSubTotals.visa.amountUSD, 'USD');
            currentTotalUSD += newSubTotals.visa.amountUSD;
            currentGrandTotalIDR += newSubTotals.visa.amountIDR;
        }
    } else if (order.serviceType === ServiceType.HANDLING) {
        const handlingData = data as HandlingBookingData;
        if (handlingData.pax && parseFloat(adminPriceInputs.handlingPricePerPaxSAR) > 0) {
            newSubTotals.handling.amountSAR = parseFloat(adminPriceInputs.handlingPricePerPaxSAR) * handlingData.pax;
            newSubTotals.handling.amountIDR = convertToIDR(newSubTotals.handling.amountSAR, 'SAR');
            currentTotalSAR += newSubTotals.handling.amountSAR;
            currentGrandTotalIDR += newSubTotals.handling.amountIDR;
        }
    }
    
    if (parseFloat(adminPriceInputs.busPriceTotalSAR) > 0 && (order.serviceType === ServiceType.HOTEL || order.serviceType === ServiceType.VISA)) {
        newSubTotals.bus.amountSAR = parseFloat(adminPriceInputs.busPriceTotalSAR);
        newSubTotals.bus.amountIDR = convertToIDR(newSubTotals.bus.amountSAR, 'SAR');
        currentTotalSAR += newSubTotals.bus.amountSAR;
        currentGrandTotalIDR += newSubTotals.bus.amountIDR;
    }

    newSubTotals.summary.totalSAR = currentTotalSAR;
    newSubTotals.summary.totalUSD = currentTotalUSD;
    newSubTotals.summary.grandTotalIDR = Math.round(currentGrandTotalIDR);
    setCalculatedSubTotals(newSubTotals);
  }, [adminPriceInputs, order]);


  const handleAdminPriceInputChange = (
    name: keyof AdminPriceInputState | string, 
    value: string
  ) => {
    setAdminPriceInputs(prev => {
      const keys = name.split('.');
      if (keys.length === 2) { 
        const [objectKey, fieldKey] = keys as [keyof AdminPriceInputState, string];
         if (objectKey === 'madinahHotelRoomPricesSAR' || objectKey === 'makkahHotelRoomPricesSAR') {
            return {
                ...prev,
                [objectKey]: {
                    ...(prev[objectKey] as object), 
                    [fieldKey]: value,
                },
            };
        }
      }
      return { ...prev, [name as keyof AdminPriceInputState]: value };
    });
  };

  const handleAdminSavePriceAndDetails = async () => {
    if (!order || !orderId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const detailsToSave = {
        madinahHotelRoomPricesSAR: {
            quad: adminPriceInputs.madinahHotelRoomPricesSAR.quad ? parseFloat(adminPriceInputs.madinahHotelRoomPricesSAR.quad) : undefined,
            triple: adminPriceInputs.madinahHotelRoomPricesSAR.triple ? parseFloat(adminPriceInputs.madinahHotelRoomPricesSAR.triple) : undefined,
            double: adminPriceInputs.madinahHotelRoomPricesSAR.double ? parseFloat(adminPriceInputs.madinahHotelRoomPricesSAR.double) : undefined,
        },
        makkahHotelRoomPricesSAR: {
            quad: adminPriceInputs.makkahHotelRoomPricesSAR.quad ? parseFloat(adminPriceInputs.makkahHotelRoomPricesSAR.quad) : undefined,
            triple: adminPriceInputs.makkahHotelRoomPricesSAR.triple ? parseFloat(adminPriceInputs.makkahHotelRoomPricesSAR.triple) : undefined,
            double: adminPriceInputs.makkahHotelRoomPricesSAR.double ? parseFloat(adminPriceInputs.makkahHotelRoomPricesSAR.double) : undefined,
        },
        visaPricePerPaxUSD: adminPriceInputs.visaPricePerPaxUSD ? parseFloat(adminPriceInputs.visaPricePerPaxUSD) : undefined,
        handlingPricePerPaxSAR: adminPriceInputs.handlingPricePerPaxSAR ? parseFloat(adminPriceInputs.handlingPricePerPaxSAR) : undefined,
        busPriceTotalSAR: adminPriceInputs.busPriceTotalSAR ? parseFloat(adminPriceInputs.busPriceTotalSAR) : undefined,
        muasasahName: adminPriceInputs.muasasahName,
      };

      const updatedOrder = await adminSetPriceAndDetails(orderId, detailsToSave);
      if (updatedOrder) {
        setOrder(updatedOrder); 
        setSelectedStatus(updatedOrder.status); 
        const customerPhone = (updatedOrder.data as any).phone;
        if (customerPhone && updatedOrder.totalPrice) {
          sendNotificationToCustomer(customerPhone, 
            `Harga untuk pesanan Anda (ID: ${orderId.substring(0,8)}) telah ditetapkan menjadi ${formatCurrency(updatedOrder.totalPrice, 'IDR')}. Mohon periksa detail pesanan Anda di aplikasi EWAKO ROYAL dan lakukan konfirmasi.`
          );
        }
        alert("Harga dan detail Muasasah berhasil disimpan. Status pesanan mungkin diubah menjadi 'Tentative Confirmation'.");
        fetchOrderDetails(false); 
      } else { throw new Error("Gagal update order dari API."); }
    } catch (err) { 
        const apiError = err as ApiErrorResponse;
        setError(apiError.message || "Gagal menyimpan harga dan detail."); 
        console.error(err); 
    } 
    finally { setIsSubmitting(false); }
  };
  
  const handleStatusUpdate = async () => { 
    if (!orderId || !selectedStatus || selectedStatus === order?.status) return;
    setIsSubmitting(true);
    setError(null);
    try {
        const updatedOrder = await updateOrderStatus(orderId, selectedStatus);
        if (updatedOrder) {
            setOrder(updatedOrder);
            alert(`Status pesanan berhasil diubah menjadi: ${selectedStatus}`);
            const customerPhone = (updatedOrder.data as any).phone;
            let messageToCustomer = `Status pesanan Anda (${updatedOrder.serviceType} - ID: ${orderId.substring(0,8)}) telah diperbarui oleh admin menjadi: ${selectedStatus}.`;
            if (selectedStatus === OrderStatus.DEFINITE_CONFIRMATION) { 
                messageToCustomer += " Silakan lakukan pembayaran Down Payment (DP). Info rekening akan kami kirimkan.";
            } else if (selectedStatus === OrderStatus.CONFIRMED_BY_ADMIN){ 
                 messageToCustomer += " Pesanan Anda telah dikonfirmasi oleh Admin. Silakan lanjutkan ke tahap berikutnya.";
            }else if (selectedStatus === OrderStatus.DOWNPAYMENT_RECEIVED) {
                messageToCustomer = `Pembayaran DP Anda untuk pesanan (${updatedOrder.serviceType} - ID: ${orderId.substring(0,8)}) telah kami konfirmasi. Terima kasih.`;
            } else if (selectedStatus === OrderStatus.FULLY_PAID) {
                messageToCustomer = `Pembayaran Anda untuk pesanan (${updatedOrder.serviceType} - ID: ${orderId.substring(0,8)}) telah lunas. Itinerary dan dokumen akan segera kami kirimkan. Terima kasih telah menggunakan layanan EWAKO ROYAL.`;
            } else if (selectedStatus === OrderStatus.CANCELLED) {
                messageToCustomer = `Pesanan Anda (${updatedOrder.serviceType} - ID: ${orderId.substring(0,8)}) telah dibatalkan oleh admin.`;
            }
            if (customerPhone) sendNotificationToCustomer(customerPhone, messageToCustomer);
        } else {
          throw new Error("Gagal update status order dari API.");
        }
    } catch(err) {
        const apiError = err as ApiErrorResponse;
        setError(apiError.message || "Gagal memperbarui status.");
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePackageInfoFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { 
    const { name, value } = e.target;
    if (name === 'busVehicleId') {
        const selectedVehicle = availableVehicles.find(v => v.id === value);
        setPackageInfoForm(prev => ({
            ...prev,
            busVehicleId: value,
            busName: selectedVehicle?.name || '',
            busVehicleType: selectedVehicle?.type || '',
            busDriverName: selectedVehicle?.driverName || '',
            busDriverPhone: selectedVehicle?.driverPhone || '',
        }));
    } else {
        setPackageInfoForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddBusRoute = () => { 
      setPackageInfoForm(prev => ({ 
          ...prev, 
          busRoutes: [...(prev.busRoutes || []), {date: '', from: '', to: '', routeVehicleId: '', vehicleDetails: ''}] 
      }));
  };

  const handleBusRouteChange = (index: number, field: keyof BusRouteItem, value: string) => { 
      setPackageInfoForm(prev => {
          const newRoutes = [...(prev.busRoutes || [])];
          const routeToUpdate = { ...newRoutes[index] };
          (routeToUpdate as any)[field] = value;

          if (field === 'routeVehicleId') {
              const selectedVehicle = availableVehicles.find(v => v.id === value);
              routeToUpdate.vehicleDetails = selectedVehicle 
                  ? `${selectedVehicle.name} (${selectedVehicle.plateNumber}) - Driver: ${selectedVehicle.driverName || '-'}` 
                  : '';
          }
          newRoutes[index] = routeToUpdate;
          return { ...prev, busRoutes: newRoutes };
      });
  };
  const handleRemoveBusRoute = (index: number) => { 
      setPackageInfoForm(prev => ({...prev, busRoutes: (prev.busRoutes || []).filter((_, i) => i !== index)}));
  };

const handleEditPackageInfoClick = async () => {
    if (availableVehicles.length === 0) {
        try {
            const vehicles = await getVehicles();
            setAvailableVehicles(vehicles);
        } catch (err) {
            setError("Gagal memuat daftar kendaraan untuk form paket info.");
            console.error(err);
        }
    }

    if (order) {
        let currentFormState = { ...initialPackageInfo, ...(order.packageInfo || {}) };
        if (order.packageInfo?.busVehicleId) {
            const selectedVehicle = availableVehicles.find(v => v.id === order.packageInfo?.busVehicleId) || (await getVehicles()).find(v => v.id === order.packageInfo?.busVehicleId);
            if (selectedVehicle) {
                currentFormState = {
                    ...currentFormState,
                    busVehicleId: selectedVehicle.id,
                    busName: selectedVehicle.name,
                    busVehicleType: selectedVehicle.type,
                    busDriverName: selectedVehicle.driverName || '',
                    busDriverPhone: selectedVehicle.driverPhone || '',
                };
            }
        } else { 
            const data = order.data as HotelBookingData; 
            currentFormState.ppiuName = data.ppiuName || currentFormState.ppiuName;
            currentFormState.madinahHotelInfo = data.madinahHotel ? formatHotelToStringForPackageInfo(data.madinahHotel) : currentFormState.madinahHotelInfo;
            currentFormState.makkahHotelInfo = data.makkahHotel ? formatHotelToStringForPackageInfo(data.makkahHotel) : currentFormState.makkahHotelInfo;
            currentFormState.airlineName = data.visaAirlineName || currentFormState.airlineName;
            currentFormState.arrivalDateTime = data.visaArrivalDate || currentFormState.arrivalDateTime;
            currentFormState.departureDateTime = data.visaDepartureDate || currentFormState.departureDateTime;
            
            let pax = 0;
            if (order.serviceType === ServiceType.HOTEL) {
                const hotelD = order.data as HotelBookingData;
                if (hotelD.visaPax && hotelD.visaPax > 0) pax = hotelD.visaPax;
                else if (hotelD.handlingPax && hotelD.handlingPax > 0) pax = hotelD.handlingPax;
            } else if (order.serviceType === ServiceType.VISA) {
                pax = (order.data as VisaBookingData).pax || 0;
            } else if (order.serviceType === ServiceType.HANDLING) {
                pax = (order.data as HandlingBookingData).pax || 0;
            }
            currentFormState.paxCount = pax > 0 ? pax : currentFormState.paxCount;
        }
        currentFormState.ewakoRoyalPhone = currentFormState.ewakoRoyalPhone || ADMIN_WHATSAPP_NUMBER.replace('+', '');
        
        if (currentFormState.busRoutes && currentFormState.busRoutes.length > 0) {
            currentFormState.busRoutes = currentFormState.busRoutes.map(route => {
                if (route.routeVehicleId) {
                    const foundVehicle = availableVehicles.find(v => v.id === route.routeVehicleId);
                    if (foundVehicle) {
                        return {
                            ...route,
                            vehicleDetails: `${foundVehicle.name} (${foundVehicle.plateNumber}) - Driver: ${foundVehicle.driverName || '-'}`
                        };
                    }
                }
                return { ...route, vehicleDetails: route.vehicleDetails || '' }; 
            });
        } else {
            currentFormState.busRoutes = [];
        }


        setPackageInfoForm(currentFormState);
    }
    setIsEditingPackageInfo(true);
};


  const handleSavePackageInfo = async () => { 
    if (!orderId || !packageInfoForm) return;
    setIsSubmitting(true);
    setError(null);
    try {
        const updatedOrder = await updatePackageInfo(orderId, packageInfoForm);
        if (updatedOrder) {
            setOrder(updatedOrder);
            setIsEditingPackageInfo(false);
            alert("Informasi paket berhasil disimpan/diperbarui.");
            await fetchOrderDetails(false); 
        } else {
          throw new Error("Gagal update info paket dari API.");
        }
    } catch (err) {
        const apiError = err as ApiErrorResponse;
        setError(apiError.message || "Gagal menyimpan informasi paket.");
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };
  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { 
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };
  const handleAddPayment = async (e: React.FormEvent) => { 
    e.preventDefault();
    if (!orderId || paymentForm.amount <= 0) {
        alert("Jumlah pembayaran (IDR) harus lebih dari 0.");
        return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
        const updatedOrder = await addPaymentToOrder(orderId, paymentForm);
        if (updatedOrder) {
            setOrder(updatedOrder);
            setShowPaymentForm(false);
            setPaymentForm(initialPaymentForm);
            alert("Pembayaran berhasil ditambahkan.");
        } else {
          throw new Error("Gagal tambah pembayaran dari API.");
        }
    } catch (err) {
        const apiError = err as ApiErrorResponse;
        setError(apiError.message || "Gagal menambahkan pembayaran.");
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };
  const handleDeletePayment = async (paymentId: string) => { 
    if (!orderId || !window.confirm("Yakin ingin menghapus pembayaran ini?")) return;
    setIsSubmitting(true);
    setError(null);
    try {
        const updatedOrder = await deletePaymentFromOrder(orderId, paymentId);
        if (updatedOrder) {
            setOrder(updatedOrder);
            alert("Pembayaran berhasil dihapus.");
        } else {
            // If API returns null/undefined on successful delete with 204, this logic needs adjustment.
            // Assuming successful deletion if no error and re-fetching data.
            await fetchOrderDetails(false); // Re-fetch to reflect deletion
            alert("Pembayaran berhasil dihapus.");
        }
    } catch (err) {
        const apiError = err as ApiErrorResponse;
        setError(apiError.message || "Gagal menghapus pembayaran.");
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };


  if (isLoading && !order) return <Layout><div className="flex justify-center items-center h-64"><LoadingSpinner /></div></Layout>;
  if (error && !order) return <Layout><p className="text-red-400 bg-red-900 p-4 rounded-md text-center">{error}</p></Layout>;
  if (!order) return <Layout><p className="text-gray-400 text-center">Detail pesanan tidak ditemukan.</p></Layout>;

  const data = order.data as any;
  const DetailItem: React.FC<{label: string, value?: string | number | React.ReactNode}> = ({label, value}) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-100 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{value || '-'}</dd>
    </div>
  );
  
  const renderOrderDataDetails = (): React.ReactNode => { 
    if (!order) return null;
    return (
        <>
            <DetailItem label="Nama Pemesan" value={data.customerName} />
            <DetailItem label="No. Handphone" value={data.phone} />
            {order.serviceType === ServiceType.HOTEL && (
                <>
                    <DetailItem label="PPIU/PIHK" value={(data as HotelBookingData).ppiuName} />
                    { (data as HotelBookingData).madinahHotel?.name && <DetailItem label="Hotel Madinah" value={`${(data as HotelBookingData).madinahHotel?.name} (${(data as HotelBookingData).madinahHotel?.nights} malam)`} />}
                    { (data as HotelBookingData).makkahHotel?.name && <DetailItem label="Hotel Mekah" value={`${(data as HotelBookingData).makkahHotel?.name} (${(data as HotelBookingData).makkahHotel?.nights} malam)`} />}
                    <DetailItem label="Handling" value={(data as HotelBookingData).includeHandling ? `Ya (${(data as HotelBookingData).handlingPax} pax)` : 'Tidak'} />
                    <DetailItem label="Visa" value={(data as HotelBookingData).includeVisa ? `Ya (${(data as HotelBookingData).visaPax} pax)` : 'Tidak'} />
                     {(data as HotelBookingData).includeVisa && <DetailItem label="Muasasah (Visa)" value={(data as HotelBookingData).muasasahName || '-'} />}
                </>
            )}
             {order.serviceType === ServiceType.VISA && (
                <>
                    <DetailItem label="Jumlah Pax (Visa)" value={(data as VisaBookingData).pax} />
                    <DetailItem label="Kendaraan (Visa)" value={(data as VisaBookingData).vehicleType || '-'} />
                    <DetailItem label="Muasasah (Visa)" value={(data as VisaBookingData).muasasahName || '-'} />
                </>
            )}
            {order.serviceType === ServiceType.HANDLING && (
                <>
                    <DetailItem label="Jumlah Pax (Handling)" value={(data as HandlingBookingData).pax} />
                    <DetailItem label="Mutowif" value={(data as HandlingBookingData).includeMutowif ? `Ya (${(data as HandlingBookingData).mutowifName || 'Belum Dipilih'})` : 'Tidak'} />
                </>
            )}
            {order.serviceType === ServiceType.JASTIP && (
                <>
                    <DetailItem label="Barang Titipan" value={`${(data as JastipBookingData).quantity} ${(data as JastipBookingData).unit} ${(data as JastipBookingData).itemType}`} />
                </>
            )}
        </>
    );
  };
  
  const renderPackageInfoForm = () => {
    const vehicleOptionsForSelect = [
        { value: '', label: 'Pilih Kendaraan' },
        ...availableVehicles.map(v => ({ value: v.id, label: `${v.name} (${v.type} - ${v.plateNumber})` }))
    ];

    return (
        <Card title="Edit Informasi Paket (Admin)" className="my-6 bg-gray-700">
             <form className="space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); handleSavePackageInfo(); }}>
                <Input label="Nama PPIU/PIHK" name="ppiuName" value={packageInfoForm.ppiuName} onChange={handlePackageInfoFormChange} />
                <Input label="No. Telpon PPIU" name="ppiuPhone" type="tel" value={packageInfoForm.ppiuPhone} onChange={handlePackageInfoFormChange} />
                <Input label="Jumlah Jemaah (Pax)" name="paxCount" type="number" min="0" value={packageInfoForm.paxCount || ''} onChange={handlePackageInfoFormChange} />
                <Textarea label="Info Hotel Madinah (Teks)" name="madinahHotelInfo" value={packageInfoForm.madinahHotelInfo || ''} onChange={handlePackageInfoFormChange} placeholder="Contoh: Hotel Hilton Madinah, 3 malam, 2 kamar Quad"/>
                <Textarea label="Info Hotel Mekah (Teks)" name="makkahHotelInfo" value={packageInfoForm.makkahHotelInfo || ''} onChange={handlePackageInfoFormChange} placeholder="Contoh: Hotel Fairmont Mekah, 4 malam, 2 kamar Quad"/>
                
                <h3 className="text-lg font-semibold text-yellow-400 pt-2 border-t border-gray-600 mt-3">Informasi Bus Utama</h3>
                <Select 
                    label="Pilih Kendaraan Bus Utama" 
                    name="busVehicleId" 
                    value={packageInfoForm.busVehicleId || ''} 
                    onChange={handlePackageInfoFormChange} 
                    options={vehicleOptionsForSelect} 
                />
                {packageInfoForm.busVehicleId && (
                    <div className="p-3 bg-gray-600 rounded-md text-sm">
                        <p><strong>Nama Bus Terpilih:</strong> {packageInfoForm.busName || '-'}</p>
                        <p><strong>Jenis Kendaraan:</strong> {packageInfoForm.busVehicleType || '-'}</p>
                        <p><strong>Nama Driver:</strong> {packageInfoForm.busDriverName || '-'}</p>
                        <p><strong>No. HP Driver:</strong> {packageInfoForm.busDriverPhone || '-'}</p>
                    </div>
                )}
                <Input label="Nomor Syarikah Bus Utama" name="busSyarikahNumber" value={packageInfoForm.busSyarikahNumber || ''} onChange={handlePackageInfoFormChange} />

                
                <fieldset className="border border-gray-600 p-3 rounded-md">
                    <legend className="text-lg font-semibold text-yellow-400 px-1">Rute Perjalanan Bus</legend>
                    {(packageInfoForm.busRoutes || []).map((route, index) => (
                        <div key={index} className="mb-3 p-3 border border-gray-500 rounded-md space-y-2 relative">
                            <h4 className="text-md font-medium text-gray-200">Rute {index + 1}</h4>
                            <Input label={`Tanggal Rute`} type="date" value={route.date} onChange={(e) => handleBusRouteChange(index, 'date', e.target.value)} />
                            <Input label="Dari" value={route.from} onChange={(e) => handleBusRouteChange(index, 'from', e.target.value)} />
                            <Input label="Ke" value={route.to} onChange={(e) => handleBusRouteChange(index, 'to', e.target.value)} />
                            <Select 
                                label="Kendaraan untuk Rute Ini"
                                name={`routeVehicleId_${index}`} 
                                value={route.routeVehicleId || ''}
                                onChange={(e) => handleBusRouteChange(index, 'routeVehicleId', e.target.value)}
                                options={vehicleOptionsForSelect}
                                placeholder="Pilih Kendaraan Rute"
                            />
                            {route.vehicleDetails && <p className="text-xs text-gray-300 bg-gray-500 p-1.5 rounded">Detail: {route.vehicleDetails}</p>}
                            <Button type="button" onClick={() => handleRemoveBusRoute(index)} variant="danger" size="sm" className="absolute top-2 right-2 !p-1">
                                <TrashIcon className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                    <Button type="button" onClick={handleAddBusRoute} variant="outline" size="sm">Tambah Rute Bus</Button>
                </fieldset>

                <h3 className="text-lg font-semibold text-yellow-400 pt-2 border-t border-gray-600 mt-3">Kontak & Penerbangan</h3>
                <Select label="Nama Mutowif" name="mutowifName" value={packageInfoForm.mutowifName || ''} onChange={handlePackageInfoFormChange} options={[{value: '', label: 'Pilih Mutowif'}, ...MOCK_MUTOWIFS.map(m => ({value: m.name, label: m.name}))]} />
                <Input label="No. Tlp Mutowif" name="mutowifPhone" type="tel" value={packageInfoForm.mutowifPhone || ''} onChange={handlePackageInfoFormChange} />
                <Input label="Nama Perwakilan Saudi" name="representativeName" value={packageInfoForm.representativeName || ''} onChange={handlePackageInfoFormChange} />
                <Input label="No. Tlp Perwakilan Saudi" name="representativePhone" type="tel" value={packageInfoForm.representativePhone || ''} onChange={handlePackageInfoFormChange} />
                <Input label="No. Tlp Ewako Royal (PIC Saudi)" name="ewakoRoyalPhone" type="tel" value={packageInfoForm.ewakoRoyalPhone || ''} onChange={handlePackageInfoFormChange} />
                <Input label="Nama Maskapai" name="airlineName" value={packageInfoForm.airlineName || ''} onChange={handlePackageInfoFormChange} />
                <Input label="Kode Penerbangan" name="airlineCode" value={packageInfoForm.airlineCode || ''} onChange={handlePackageInfoFormChange} />
                <Input label="Tgl & Waktu Kedatangan Saudi" name="arrivalDateTime" type="datetime-local" value={packageInfoForm.arrivalDateTime || ''} onChange={handlePackageInfoFormChange} />
                <Input label="Tgl & Waktu Kepulangan (dari Saudi)" name="departureDateTime" type="datetime-local" value={packageInfoForm.departureDateTime || ''} onChange={handlePackageInfoFormChange} />

                <div className="flex justify-end space-x-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditingPackageInfo(false)} disabled={isSubmitting}>Batal</Button>
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>Simpan Info Paket</Button>
                </div>
            </form>
        </Card>
    );
  };
  
const renderHotelPriceInputSection = (
    hotelInfo: HotelInfo | undefined,
    hotelKey: 'madinahHotelRoomPricesSAR' | 'makkahHotelRoomPricesSAR',
    hotelTitle: string,
    subTotalsSAR: { quad: number; triple: number; double: number; total: number },
    subTotalsIDR: { quad: number; triple: number; double: number; total: number }
) => {
    if (!hotelInfo || !hotelInfo.name) return null;

    return (
        <div className="mt-4 pt-3 border-t border-gray-600">
            <h4 className="text-md font-semibold text-yellow-500 mb-2">{hotelTitle}</h4>
            {hotelInfo.rooms.quad > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-end mb-2 p-2 border border-gray-500 rounded">
                    <div>
                        <p className="text-sm font-medium">Kamar Quad</p>
                        <p className="text-xs text-gray-400">Jml Kamar: {hotelInfo.rooms.quad}, Durasi: {hotelInfo.nights} malam</p>
                        <Input
                            label="Harga Quad per Malam (SAR)"
                            type="number"
                            name={`${hotelKey}.quad`}
                            value={adminPriceInputs[hotelKey].quad}
                            onChange={(e) => handleAdminPriceInputChange(e.target.name, e.target.value)}
                            placeholder="Harga SAR"
                            className="mt-1"
                        />
                    </div>
                    <p className="text-sm md:text-right mt-2 md:mt-0">Subtotal: {formatCurrency(subTotalsSAR.quad, 'SAR')} ({formatCurrency(subTotalsIDR.quad, 'IDR')})</p>
                </div>
            )}
            {hotelInfo.rooms.triple > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-end mb-2 p-2 border border-gray-500 rounded">
                    <div>
                        <p className="text-sm font-medium">Kamar Triple</p>
                        <p className="text-xs text-gray-400">Jml Kamar: {hotelInfo.rooms.triple}, Durasi: {hotelInfo.nights} malam</p>
                        <Input
                            label="Harga Triple per Malam (SAR)"
                            type="number"
                            name={`${hotelKey}.triple`}
                            value={adminPriceInputs[hotelKey].triple}
                            onChange={(e) => handleAdminPriceInputChange(e.target.name, e.target.value)}
                            placeholder="Harga SAR"
                            className="mt-1"
                        />
                    </div>
                     <p className="text-sm md:text-right mt-2 md:mt-0">Subtotal: {formatCurrency(subTotalsSAR.triple, 'SAR')} ({formatCurrency(subTotalsIDR.triple, 'IDR')})</p>
                </div>
            )}
            {hotelInfo.rooms.double > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 items-end mb-2 p-2 border border-gray-500 rounded">
                    <div>
                        <p className="text-sm font-medium">Kamar Double</p>
                        <p className="text-xs text-gray-400">Jml Kamar: {hotelInfo.rooms.double}, Durasi: {hotelInfo.nights} malam</p>
                        <Input
                            label="Harga Double per Malam (SAR)"
                            type="number"
                            name={`${hotelKey}.double`}
                            value={adminPriceInputs[hotelKey].double}
                            onChange={(e) => handleAdminPriceInputChange(e.target.name, e.target.value)}
                            placeholder="Harga SAR"
                            className="mt-1"
                        />
                    </div>
                    <p className="text-sm md:text-right mt-2 md:mt-0">Subtotal: {formatCurrency(subTotalsSAR.double, 'SAR')} ({formatCurrency(subTotalsIDR.double, 'IDR')})</p>
                </div>
            )}
             <p className="text-sm font-semibold text-right mt-2">Total {hotelTitle}: {formatCurrency(subTotalsSAR.total, 'SAR')} ({formatCurrency(subTotalsIDR.total, 'IDR')})</p>
        </div>
    );
};

  const renderAdminDetailedPricingForm = () => (
    <Card title="Input Harga Rinci & Detail Muasasah (Admin)" className="mb-6 bg-gray-700">
        <div className="p-4 space-y-4">
            {order.serviceType === ServiceType.HOTEL && 
                renderHotelPriceInputSection(
                    (order.data as HotelBookingData).madinahHotel, 
                    'madinahHotelRoomPricesSAR', 
                    'Hotel Madinah', 
                    calculatedSubTotals.madinahHotel.subtotalSAR,
                    calculatedSubTotals.madinahHotel.subtotalIDR
                )}
            
            {order.serviceType === ServiceType.HOTEL && 
                renderHotelPriceInputSection(
                    (order.data as HotelBookingData).makkahHotel, 
                    'makkahHotelRoomPricesSAR', 
                    'Hotel Mekah',
                    calculatedSubTotals.makkahHotel.subtotalSAR,
                    calculatedSubTotals.makkahHotel.subtotalIDR
                )}

            {((order.serviceType === ServiceType.HOTEL && (order.data as HotelBookingData).includeVisa) || order.serviceType === ServiceType.VISA) && (
                <Input label="Harga Visa per Orang (USD)" type="number" name="visaPricePerPaxUSD" value={adminPriceInputs.visaPricePerPaxUSD} onChange={(e) => handleAdminPriceInputChange(e.target.name, e.target.value)} placeholder="Harga USD"/>
            )}
            {((order.serviceType === ServiceType.HOTEL && (order.data as HotelBookingData).includeHandling) || order.serviceType === ServiceType.HANDLING) && (
                <Input label="Harga Handling per Orang (SAR)" type="number" name="handlingPricePerPaxSAR" value={adminPriceInputs.handlingPricePerPaxSAR} onChange={(e) => handleAdminPriceInputChange(e.target.name, e.target.value)} placeholder="Harga SAR"/>
            )}
            {(order.serviceType === ServiceType.HOTEL || order.serviceType === ServiceType.VISA) && (
                 <Input label="Harga Total Bus (SAR)" type="number" name="busPriceTotalSAR" value={adminPriceInputs.busPriceTotalSAR} onChange={(e) => handleAdminPriceInputChange(e.target.name, e.target.value)} placeholder="Harga SAR"/>
            )}
             {((order.serviceType === ServiceType.HOTEL && (order.data as HotelBookingData).includeVisa) || order.serviceType === ServiceType.VISA) && (
                <Input label="Nama Muasasah (Visa)" name="muasasahName" value={adminPriceInputs.muasasahName} onChange={(e) => handleAdminPriceInputChange(e.target.name, e.target.value)} placeholder="Masukkan nama Muasasah"/>
            )}

            <div className="mt-4 p-3 bg-gray-800 rounded-md space-y-1">
                <h4 className="text-md font-semibold text-yellow-400 mb-2">Estimasi Perhitungan Total Paket:</h4>
                {calculatedSubTotals.madinahHotel.subtotalSAR.total > 0 && <p className="text-sm">Total Hotel Madinah: {formatCurrency(calculatedSubTotals.madinahHotel.subtotalSAR.total, 'SAR')} ({formatCurrency(calculatedSubTotals.madinahHotel.subtotalIDR.total, 'IDR')})</p>}
                {calculatedSubTotals.makkahHotel.subtotalSAR.total > 0 && <p className="text-sm">Total Hotel Mekah: {formatCurrency(calculatedSubTotals.makkahHotel.subtotalSAR.total, 'SAR')} ({formatCurrency(calculatedSubTotals.makkahHotel.subtotalIDR.total, 'IDR')})</p>}
                {calculatedSubTotals.visa.amountUSD > 0 && <p className="text-sm">Subtotal Visa: {formatCurrency(calculatedSubTotals.visa.amountUSD, 'USD')} ({formatCurrency(calculatedSubTotals.visa.amountIDR, 'IDR')})</p>}
                {calculatedSubTotals.handling.amountSAR > 0 && <p className="text-sm">Subtotal Handling: {formatCurrency(calculatedSubTotals.handling.amountSAR, 'SAR')} ({formatCurrency(calculatedSubTotals.handling.amountIDR, 'IDR')})</p>}
                {calculatedSubTotals.bus.amountSAR > 0 && <p className="text-sm">Subtotal Bus: {formatCurrency(calculatedSubTotals.bus.amountSAR, 'SAR')} ({formatCurrency(calculatedSubTotals.bus.amountIDR, 'IDR')})</p>}
                <hr className="my-2 border-gray-600"/>
                <p className="text-sm">Total Estimasi (SAR): {formatCurrency(calculatedSubTotals.summary.totalSAR, 'SAR', true, 2)}</p>
                <p className="text-sm">Total Estimasi (USD): {formatCurrency(calculatedSubTotals.summary.totalUSD, 'USD', true, 2)}</p>
                <p className="text-xs text-gray-400">Kurs Digunakan: 1 USD = {formatCurrency(MOCK_EXCHANGE_RATES.USD_TO_IDR, 'IDR', true, 0)}, 1 SAR = {formatCurrency(MOCK_EXCHANGE_RATES.SAR_TO_IDR, 'IDR', true, 0)}</p>
                <p className="text-lg font-bold mt-1">Grand Total Estimasi (IDR): {formatCurrency(calculatedSubTotals.summary.grandTotalIDR, 'IDR')}</p>
            </div>

            <Button onClick={handleAdminSavePriceAndDetails} isLoading={isSubmitting} variant="primary">
                Simpan Harga & Detail (Total IDR akan jadi harga paket)
            </Button>
        </div>
    </Card>
  );

  const totalPaid = order?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remainingPayment = (order?.totalPrice || 0) - totalPaid;
  const canSetPrice = order.status === OrderStatus.REQUEST_CONFIRMATION || order.status === OrderStatus.TENTATIVE_CONFIRMATION || order.status === OrderStatus.DEFINITE_CONFIRMATION;


  return (
    <Layout>
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/admin/orders')} className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors">
            <ArrowLeftIcon className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold metallic-gold-text">Detail Pesanan (Admin)</h1>
      </div>
      
      {error && <p className="text-red-400 bg-red-900 p-3 rounded-md mb-4">{error}</p>}

      <Card title={`Order ID: ${order.id.substring(0,12)}...`} className="mb-6 bg-gray-800">
          <dl className="divide-y divide-gray-700">
            <DetailItem label="Jenis Layanan" value={order.serviceType} />
            <DetailItem label="Status Saat Ini" value={<span className="font-semibold metallic-gold-text">{order.status}</span>} />
            <DetailItem label="Tanggal Pesan" value={formatDateTimeForDisplay(order.createdAt)} />
            {renderOrderDataDetails()}
            {order.status === OrderStatus.TENTATIVE_CONFIRMATION && ( <DetailItem label="Konfirmasi Pelanggan" value={order.customerConfirmation === true ? <span className="text-green-400">DIKONFIRMASI</span> : order.customerConfirmation === false ? <span className="text-red-400">DITOLAK</span> : "Menunggu"} /> )}
            <DetailItem label="Harga Total Paket (Final)" value={formatCurrency(order.totalPrice, 'IDR') || 'Belum Ditetapkan'} />
          </dl>
      </Card>

      {canSetPrice && renderAdminDetailedPricingForm()}

      <Card title="Update Status Pesanan" className="mb-6 bg-gray-800">
        <div className="space-y-4"> <Select label="Pilih Status Baru:" options={statusOptions} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)} /> <Button onClick={handleStatusUpdate} isLoading={isSubmitting} variant="primary"> Update Status </Button> </div>
      </Card>
      
      <Card title="Kelola Pembayaran Pesanan Ini" className="my-6 bg-gray-800">
        <div className="space-y-3">
            <p className="text-gray-300">Total Tagihan: <span className="font-semibold">{formatCurrency(order.totalPrice, 'IDR')}</span></p>
            <p className="text-green-400">Total Terbayar: <span className="font-semibold">{formatCurrency(totalPaid, 'IDR')}</span></p>
            <p className={`${remainingPayment > 0 ? 'text-red-400' : 'text-gray-300'}`}>Sisa Tagihan: <span className="font-semibold">{formatCurrency(remainingPayment, 'IDR')}</span></p>
            
            <h4 className="text-md font-semibold text-yellow-400 pt-2 border-t border-gray-700 mt-3">Riwayat Pembayaran (IDR):</h4>
            {(order.payments || []).length === 0 ? <p className="text-sm text-gray-400">Belum ada pembayaran.</p> : (
                <ul className="space-y-1 text-sm">
                    {(order.payments || []).map(p => (
                        <li key={p.id} className="flex justify-between items-center p-1.5 bg-gray-700 rounded">
                            <span>{p.paymentType} - {p.paymentMethod} - {formatCurrency(p.amount, 'IDR')} ({formatDateForDisplay(p.paymentDate)})</span>
                            <Button variant="danger" size="sm" onClick={() => handleDeletePayment(p.id)} className="!p-1"><TrashIcon className="h-3 w-3"/></Button>
                        </li>
                    ))}
                </ul>
            )}
            
            <Button onClick={() => setShowPaymentForm(!showPaymentForm)} variant="outline" size="sm" className="mt-3">
                {showPaymentForm ? 'Tutup Form Pembayaran' : 'Tambah Pembayaran (IDR)'}
            </Button>

            {showPaymentForm && (
                <form onSubmit={handleAddPayment} className="mt-3 space-y-3 p-3 border border-gray-700 rounded-md bg-gray-750">
                    <Input label="Jumlah Pembayaran (IDR)" type="number" name="amount" value={paymentForm.amount.toString()} onChange={handlePaymentFormChange} required />
                    <Input label="Tanggal Bayar" type="date" name="paymentDate" value={paymentForm.paymentDate} onChange={handlePaymentFormChange} required />
                    <Select label="Jenis Pembayaran" name="paymentType" options={paymentTypeOptions} value={paymentForm.paymentType} onChange={handlePaymentFormChange} required />
                    <Select label="Metode Pembayaran" name="paymentMethod" options={paymentMethodOptions} value={paymentForm.paymentMethod} onChange={handlePaymentFormChange} required />
                    <Textarea label="Catatan Pembayaran (Opsional)" name="notes" value={paymentForm.notes || ''} onChange={handlePaymentFormChange} />
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>Simpan Pembayaran</Button>
                </form>
            )}
        </div>
      </Card>

      {isEditingPackageInfo ? renderPackageInfoForm() : ( 
        <div className="mb-6">
            <PackageInfoDisplay packageInfo={order.packageInfo} /> 
            <Button onClick={handleEditPackageInfoClick} variant="outline" className="mt-4"> 
                {order.packageInfo && Object.values(order.packageInfo).some(v => !!v && (Array.isArray(v) ? v.length > 0 : true) ) ? 'Ubah' : 'Tambah'} Informasi Paket 
            </Button> 
        </div>
      )}
      <Card title="Manifest Jemaah (Diisi oleh Pengguna)" className="my-6 bg-gray-800">
        {(order.manifest || []).length === 0 && <p className="text-gray-400">Belum ada data manifest.</p>}
        <ul className="space-y-2">
            {(order.manifest || []).map(item => (
                <li key={item.id} className="p-2 bg-gray-700 rounded text-sm">
                    {item.namaJemaah} ({item.jenisKelamin?.charAt(0)}, {item.usia} th) - Paspor: {item.nomorPaspor}
                </li>
            ))}
        </ul>
      </Card>
      <Card title="Tindakan Cepat (Generate PDF)" className="mt-6 bg-gray-800"> 
         <div className="flex flex-wrap gap-2">
            <Button onClick={() => generateOrderRequestPdf(order)} variant="secondary" size="sm">Surat Permintaan Pesanan</Button>
            {order.totalPrice && order.status !== OrderStatus.REQUEST_CONFIRMATION && <Button onClick={() => generateInvoicePdf(order)} variant="secondary" size="sm">Invoice</Button>}
            {order.packageInfo && <Button onClick={() => generatePackageInfoPdf(order)} variant="secondary" size="sm">Informasi Paket</Button>}
        </div>
      </Card>
    </Layout>
  );
};

export default AdminOrderDetailsPage;
