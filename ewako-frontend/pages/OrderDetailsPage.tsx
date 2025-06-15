
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Order, OrderStatus, HotelBookingData, VisaBookingData, HandlingBookingData, JastipBookingData, ServiceType, RoomBooking, HotelInfo, PackageInfoData, ManifestItem, ChatMessage, User as AuthUserType, JastipItemType, JastipUnit, Vehicle, BusRouteItem } from '../../types';
import { getOrderById, updateOrderStatus, updateOrderData, updatePackageInfo, updateOrderManifest } from '../../services/orderService'; // Updated
import { getVehicles } from '../../services/vehicleService'; // Updated
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { ArrowLeftIcon, PencilIcon, TrashIcon, PlusCircleIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { PackageInfoDisplay } from '../../components/PackageInfoDisplay';
import { sendNotificationToCustomer } from '../../services/whatsappService';
import { ADMIN_WHATSAPP_NUMBER, MOCK_MUTOWIFS, JASTIP_UNITS_MAP } from '../../constants';
import { generateOrderRequestPdf, generateInvoicePdf, generatePackageInfoPdf } from '../../services/pdfService';
import { useAuth } from '../../App.tsx'; 
import { ChatMessageBubble } from '../../components/ChatMessageBubble';
import { ChatInput } from '../../components/ChatInput';
import { getChatMessagesForOrder, sendChatMessage } from '../../services/chatService'; // Updated
import { getUserById as getAuthUserInfo } from '../../services/userService'; // Updated
import { formatCurrency, convertToIDR, MOCK_EXCHANGE_RATES } from '../../services/currencyService';
import { ApiErrorResponse } from '../../services/api';


// Helper functions (remain mostly the same)
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
    busRoutes: [], mutowifName: '', mutowifPhone: '', representativeName: '', 
    representativePhone: '', ewakoRoyalPhone: '', airlineName: '', airlineCode: '', 
    arrivalDateTime: '', departureDateTime: '' 
};
const initialManifestItemForm: Omit<ManifestItem, 'id' | 'usia'> = { namaJemaah: '', jenisKelamin: '', tanggalLahir: '', nomorVisa: '', namaDiPaspor: '', nomorPaspor: '', tanggalTerbitPaspor: '', tanggalExpiredPaspor: '', kotaTempatIssuedPaspor: '' };
const initialHotelInfoForEdit: HotelInfo = { name: '', nights: 1, rooms: { quad: 0, triple: 0, double: 0 }, checkIn: '', checkOut: '' };

const DetailItemLocal: React.FC<{label: string, value?: string | number | React.ReactNode}> = ({label, value}) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-100 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{value || '-'}</dd>
    </div>
);

const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { userId: currentAuthUserId, userRole } = useAuth(); 
  const [currentUser, setCurrentUser] = useState<AuthUserType | null>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditingOrderData, setIsEditingOrderData] = useState(false);
  const [editableOrderData, setEditableOrderData] = useState<Partial<HotelBookingData | VisaBookingData | HandlingBookingData>>({}); 
  const [isEditingPackageInfo, setIsEditingPackageInfo] = useState(false);
  const [packageInfoForm, setPackageInfoForm] = useState<PackageInfoData>(initialPackageInfo);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]); 

  const [showManifestFormModal, setShowManifestFormModal] = useState(false);
  const [currentEditingManifestItem, setCurrentEditingManifestItem] = useState<ManifestItem | null>(null);
  const [manifestItemForm, setManifestItemForm] = useState<Omit<ManifestItem, 'id' | 'usia'>>(initialManifestItemForm);
  const [manifestItemAge, setManifestItemAge] = useState<number | undefined>(undefined);

  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChatMessages, setIsLoadingChatMessages] = useState(false);
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  const fetchOrderDetails = useCallback(async (showLoadingSpinner = true) => {
    if (!orderId) {
      setError("Order ID tidak valid.");
      setIsLoading(false);
      return;
    }
    if (showLoadingSpinner) setIsLoading(true);
    setError(null);
    try {
      const fetchedOrder = await getOrderById(orderId);
      const vehicles = await getVehicles(); 
      setAvailableVehicles(vehicles);

      if (fetchedOrder) {
        if (userRole === 'customer' && fetchedOrder.userId !== currentAuthUserId) {
            setError("Anda tidak diizinkan untuk melihat detail pesanan ini.");
            setOrder(null);
        } else {
            setOrder(fetchedOrder);
            setEditableOrderData(fetchedOrder.data);
            
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
        }
      } else {
        setError("Pesanan tidak ditemukan.");
      }
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError.message || "Gagal memuat detail pesanan.");
      console.error(err);
    } finally {
      if (showLoadingSpinner) setIsLoading(false);
    }
  }, [orderId, currentAuthUserId, userRole]);

  useEffect(() => {
    if (currentAuthUserId) {
        getAuthUserInfo(currentAuthUserId).then(setCurrentUser).catch(err => console.error("Failed to fetch current user info:", err));
    }
    fetchOrderDetails();
  }, [fetchOrderDetails, currentAuthUserId]);
  
  const scrollToChatBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToChatBottom, [chatMessages]);

  const handleCustomerConfirmation = async (confirmed: boolean) => {
    if (!orderId || !order) return;
    setIsSubmitting(true);
    setError(null);
    try {
        const newStatus = confirmed ? OrderStatus.DEFINITE_CONFIRMATION : OrderStatus.REJECTED_BY_CUSTOMER;
        const updatedOrder = await updateOrderStatus(orderId, newStatus, confirmed);
        if (updatedOrder) {
            setOrder(updatedOrder);
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
        setError(apiError.message || "Gagal memperbarui status konfirmasi.");
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleEditOrderDataChange = useCallback((
    targetType: 'madinahHotel' | 'makkahHotel' | 'main',
    field: keyof HotelInfo | keyof RoomBooking | keyof HotelBookingData | keyof VisaBookingData | keyof HandlingBookingData,
    value: string | number | boolean
  ) => {
    setEditableOrderData(prev => {
        const newState = { ...prev } as any;
        if (targetType === 'madinahHotel' || targetType === 'makkahHotel') {
            if (!newState[targetType]) newState[targetType] = { ...initialHotelInfoForEdit };
            const hotelToUpdate = { ...newState[targetType] };

            if (field === 'quad' || field === 'triple' || field === 'double') {
                hotelToUpdate.rooms = { ...hotelToUpdate.rooms, [field]: Math.max(0, Number(value)) };
            } else if (field === 'nights') {
                (hotelToUpdate as any)[field] = Math.max(1, Number(value));
            } else {
                (hotelToUpdate as any)[field] = value;
            }
            newState[targetType] = hotelToUpdate;
            if ((field === 'checkIn' || field === 'nights') && hotelToUpdate.checkIn && hotelToUpdate.nights > 0) {
                const checkInDate = new Date(hotelToUpdate.checkIn);
                if (!isNaN(checkInDate.getTime())) {
                    checkInDate.setDate(checkInDate.getDate() + hotelToUpdate.nights);
                    hotelToUpdate.checkOut = checkInDate.toISOString().split('T')[0];
                }
            }


        } else { 
            if (field === 'includeVisa' && typeof value === 'boolean' && !value) {
                 newState.visaPax = 0;
                 newState.visaVehicleType = '';
                 newState.visaAirlineName = '';
                 newState.visaArrivalDate = '';
                 newState.visaDepartureDate = '';
            }
            newState[field] = value;
        }
        return newState;
    });
  }, []);

  const saveOrderDataChanges = async () => {
    if (!orderId || !order || Object.keys(editableOrderData).length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
        const updatedOrder = await updateOrderData(orderId, editableOrderData);
        if (updatedOrder) {
            setOrder(updatedOrder);
            setIsEditingOrderData(false);
            alert("Detail pesanan berhasil diperbarui.");
        } else {
          throw new Error("Failed to update order data from API.");
        }
    } catch (err) {
        const apiError = err as ApiErrorResponse;
        setError(apiError.message || "Gagal menyimpan perubahan detail pesanan.");
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

  const handleAddBusRoutePackageInfo = () => {
    setPackageInfoForm(prev => ({
        ...prev,
        busRoutes: [...(prev.busRoutes || []), { date: '', from: '', to: '', routeVehicleId: '', vehicleDetails: '' }]
    }));
  };
  
  const handleBusRouteChangePackageInfo = (index: number, field: keyof BusRouteItem, value: string) => {
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
  
  const handleRemoveBusRoutePackageInfo = (index: number) => {
    setPackageInfoForm(prev => ({
        ...prev,
        busRoutes: (prev.busRoutes || []).filter((_, i) => i !== index)
    }));
  };

const handleEditPackageInfoClick = async () => {
    if (availableVehicles.length === 0) { 
        try {
            const vehicles = await getVehicles();
            setAvailableVehicles(vehicles);
        } catch (err) {
            console.error("Failed to load vehicles for package info form:", err);
        }
    }

    if (order) {
        let currentFormState = { ...initialPackageInfo, ...(order.packageInfo || {}) };
        
        if (order.packageInfo?.busVehicleId) {
            const selectedVehicle = availableVehicles.find(v => v.id === order.packageInfo?.busVehicleId);
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
        }
        
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
        currentFormState.paxCount = pax > 0 ? pax : (currentFormState.paxCount || 0);
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
          throw new Error("Failed to update package info from API.");
        }
    } catch (err) {
        const apiError = err as ApiErrorResponse;
        setError(apiError.message || "Gagal menyimpan informasi paket.");
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const calculateAge = (birthDateString: string): number | undefined => {
    if (!birthDateString) return undefined;
    const birthDate = new Date(birthDateString);
    if (isNaN(birthDate.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };
  useEffect(() => { setManifestItemAge(calculateAge(manifestItemForm.tanggalLahir)); }, [manifestItemForm.tanggalLahir]);

  const handleOpenManifestForm = (item?: ManifestItem) => {
    if (item) {
        setCurrentEditingManifestItem(item);
        const { id, usia, ...formData } = item;
        setManifestItemForm(formData);
    } else {
        setCurrentEditingManifestItem(null);
        setManifestItemForm(initialManifestItemForm);
    }
    setShowManifestFormModal(true);
  };
  
  const handleCloseManifestForm = () => {
    setShowManifestFormModal(false);
    setCurrentEditingManifestItem(null);
    setManifestItemForm(initialManifestItemForm);
    setManifestItemAge(undefined);
  };

  const handleManifestItemFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setManifestItemForm({ ...manifestItemForm, [e.target.name]: e.target.value });
  };
  
  const handleSaveManifestItem = async () => {
    if(!order || !orderId) return;
    setIsSubmitting(true);
    setError(null);
    try {
        let currentManifest = order.manifest || [];
        if (currentEditingManifestItem) { 
            currentManifest = currentManifest.map(item => 
                item.id === currentEditingManifestItem.id 
                ? { ...currentEditingManifestItem, ...manifestItemForm, usia: calculateAge(manifestItemForm.tanggalLahir) } 
                : item
            );
        } else { 
            const newItem: ManifestItem = {
                id: `manifest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, // Client-side ID for new items if backend generates its own
                ...manifestItemForm,
                usia: calculateAge(manifestItemForm.tanggalLahir),
            };
            currentManifest.push(newItem);
        }
        const updatedOrder = await updateOrderManifest(orderId, currentManifest);
        if (updatedOrder) {
            setOrder(updatedOrder);
            handleCloseManifestForm();
            alert(`Item manifest berhasil ${currentEditingManifestItem ? 'diperbarui' : 'ditambahkan'}.`);
        } else {
          throw new Error("Failed to update manifest from API.");
        }
    } catch (err) {
        const apiError = err as ApiErrorResponse;
        setError(apiError.message || `Gagal menyimpan item manifest.`);
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteManifestItem = async (itemId: string) => {
    if(!order || !orderId || !window.confirm("Yakin ingin menghapus item manifest ini?")) return;
    setIsSubmitting(true); 
    setError(null);
    try {
        const currentManifest = (order.manifest || []).filter(item => item.id !== itemId);
        const updatedOrder = await updateOrderManifest(orderId, currentManifest);
        if (updatedOrder) {
            setOrder(updatedOrder);
            alert("Item manifest berhasil dihapus.");
        } else {
          throw new Error("Failed to delete manifest item from API.");
        }
    } catch (err) {
        const apiError = err as ApiErrorResponse;
        setError(apiError.message || "Gagal menghapus item manifest.");
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleOpenChatModal = async () => {
    if (!order || !currentAuthUserId || !currentUser) return;
    setShowChatModal(true);
    setIsLoadingChatMessages(true);
    setError(null);
    try {
        const messages = await getChatMessagesForOrder(order.id);
        setChatMessages(messages);
    } catch (error) {
        const apiError = error as ApiErrorResponse;
        setError(apiError.message || "Gagal memuat pesan chat.");
        console.error("Failed to load chat messages:", error);
        setChatMessages([]); 
    } finally {
        setIsLoadingChatMessages(false);
    }
  };

  const handleSendChatMessage = async (text?: string, file?: File) => {
    if (!order || !currentUser || (!text && !file)) return;
    setIsSendingChatMessage(true);
    setError(null);
    try {
        const newMessage = await sendChatMessage(order.id, currentUser.name, currentUser.id, text, file);
        if (newMessage) {
            setChatMessages(prev => [...prev, newMessage]);
        }
    } catch (error) {
        const apiError = error as ApiErrorResponse;
        setError(apiError.message || "Gagal mengirim pesan chat.");
        console.error("Failed to send chat message:", error);
    } finally {
        setIsSendingChatMessage(false);
    }
  };


  if (isLoading && !order) return <Layout><div className="flex justify-center items-center h-64"><LoadingSpinner /></div></Layout>;
  if (error && !order) return <Layout><p className="text-red-400 bg-red-900 p-4 rounded-md text-center">{error}</p></Layout>;
  if (!order) return <Layout><p className="text-gray-400 text-center">Detail pesanan tidak ditemukan.</p></Layout>;

  const data = order.data as any; 
  const canEditOrderDataByUser = order.status === OrderStatus.REQUEST_CONFIRMATION && userRole === 'customer';
  const canUserModifyDetails = order.status !== OrderStatus.CONFIRMED_BY_ADMIN && order.status !== OrderStatus.DOWNPAYMENT_RECEIVED && order.status !== OrderStatus.FULLY_PAID && order.status !== OrderStatus.CANCELLED;

  const renderHotelSectionDetails = (hotelInfo: HotelInfo | undefined, title: string) => {
    if (!hotelInfo || !hotelInfo.name) return <DetailItemLocal label={title} value="Tidak ada data" />;
    
    let costDisplay = '';
    if (hotelInfo.pricesSAR && (order.status !== OrderStatus.REQUEST_CONFIRMATION || order.totalPrice)) {
        let hotelTotalCostSAR = 0;
        if (hotelInfo.rooms.quad > 0 && hotelInfo.pricesSAR.quad) {
            hotelTotalCostSAR += hotelInfo.pricesSAR.quad * hotelInfo.nights * hotelInfo.rooms.quad;
        }
        if (hotelInfo.rooms.triple > 0 && hotelInfo.pricesSAR.triple) {
            hotelTotalCostSAR += hotelInfo.pricesSAR.triple * hotelInfo.nights * hotelInfo.rooms.triple;
        }
        if (hotelInfo.rooms.double > 0 && hotelInfo.pricesSAR.double) {
            hotelTotalCostSAR += hotelInfo.pricesSAR.double * hotelInfo.nights * hotelInfo.rooms.double;
        }
        if (hotelTotalCostSAR > 0) {
            costDisplay = ` (${formatCurrency(hotelTotalCostSAR, 'SAR')}, setara ${formatCurrency(convertToIDR(hotelTotalCostSAR, 'SAR'), 'IDR')})`;
        }
    } else if (order.status === OrderStatus.REQUEST_CONFIRMATION && !order.totalPrice) {
        costDisplay = ` (Harga akan ditetapkan admin)`;
    }

    return <>
        <DetailItemLocal label={`${title} - Nama`} value={`${hotelInfo.name}${costDisplay}`} />
        <DetailItemLocal label={`${title} - Check In`} value={formatDateForDisplay(hotelInfo.checkIn)} />
        <DetailItemLocal label={`${title} - Durasi`} value={`${hotelInfo.nights} malam`} />
        <DetailItemLocal label={`${title} - Check Out`} value={formatDateForDisplay(hotelInfo.checkOut)} />
        <DetailItemLocal label={`${title} - Kamar Quad`} value={hotelInfo.rooms.quad} />
        <DetailItemLocal label={`${title} - Kamar Triple`} value={hotelInfo.rooms.triple} />
        <DetailItemLocal label={`${title} - Kamar Double`} value={hotelInfo.rooms.double} />
    </>;
  };
  
  const renderHotelDetails = (hotelData: HotelBookingData) => (
    <>
        <DetailItemLocal label="Nama Pemesan" value={hotelData.customerName} />
        <DetailItemLocal label="PPIU/PIHK" value={hotelData.ppiuName} />
        <DetailItemLocal label="No. Handphone" value={hotelData.phone} />
        <DetailItemLocal label="Alamat" value={hotelData.address} />
        {renderHotelSectionDetails(hotelData.madinahHotel, "Hotel Madinah")}
        {renderHotelSectionDetails(hotelData.makkahHotel, "Hotel Mekah")}
        <DetailItemLocal label="Include Handling" value={hotelData.includeHandling ? `Ya (${hotelData.handlingPax} pax)` : 'Tidak'} />
        {hotelData.includeHandling && hotelData.handlingPricePerPaxSAR && hotelData.handlingPax && (order.status !== OrderStatus.REQUEST_CONFIRMATION || order.totalPrice) &&
            <DetailItemLocal label="Estimasi Biaya Handling" value={`${formatCurrency(hotelData.handlingPricePerPaxSAR * hotelData.handlingPax, 'SAR')} (setara ${formatCurrency(convertToIDR(hotelData.handlingPricePerPaxSAR * hotelData.handlingPax, 'SAR'), 'IDR')})`} />
        }
        <DetailItemLocal label="Include Visa" value={hotelData.includeVisa ? `Ya (${hotelData.visaPax} pax)` : 'Tidak'} />
        {hotelData.includeVisa && <>
            <DetailItemLocal label="Nama Muasasah (Visa)" value={hotelData.muasasahName || '-'} />
            {hotelData.visaPricePerPaxUSD && hotelData.visaPax && (order.status !== OrderStatus.REQUEST_CONFIRMATION || order.totalPrice) &&
                <DetailItemLocal label="Estimasi Biaya Visa" value={`${formatCurrency(hotelData.visaPricePerPaxUSD * hotelData.visaPax, 'USD')} (setara ${formatCurrency(convertToIDR(hotelData.visaPricePerPaxUSD * hotelData.visaPax, 'USD'), 'IDR')})`} />
            }
            <DetailItemLocal label="Visa - Kendaraan" value={hotelData.visaVehicleType} />
            <DetailItemLocal label="Visa - Maskapai" value={hotelData.visaAirlineName} />
            <DetailItemLocal label="Visa - Tgl & Waktu Kedatangan" value={formatDateTimeForDisplay(hotelData.visaArrivalDate)} />
            <DetailItemLocal label="Visa - Tgl & Waktu Kepulangan" value={formatDateTimeForDisplay(hotelData.visaDepartureDate)} />
        </>}
        {hotelData.busPriceTotalSAR && hotelData.busPriceTotalSAR > 0 && (order.status !== OrderStatus.REQUEST_CONFIRMATION || order.totalPrice) &&
             <DetailItemLocal label="Biaya Bus (Total)" value={`${formatCurrency(hotelData.busPriceTotalSAR, 'SAR')} (setara ${formatCurrency(convertToIDR(hotelData.busPriceTotalSAR, 'SAR'), 'IDR')})`} />
        }
    </>
  );

  const renderHotelEditFormSection = (currentHotelData: HotelInfo | undefined, hotelType: 'madinahHotel' | 'makkahHotel', title: string) => {
    const data = currentHotelData || initialHotelInfoForEdit;
    return (
        <Card title={title} className="mb-4 bg-gray-700">
            <div className="space-y-3 p-3">
                 <Input label="Nama Hotel" name="name" value={data.name} onChange={(e) => handleEditOrderDataChange(hotelType, 'name', e.target.value)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input label="Tanggal Check In" name="checkIn" type="date" value={data.checkIn} onChange={(e) => handleEditOrderDataChange(hotelType, 'checkIn', e.target.value)} />
                    <Input label="Jumlah Malam" name="nights" type="number" min="1" value={data.nights} onChange={(e) => handleEditOrderDataChange(hotelType, 'nights', parseInt(e.target.value))} />
                </div>
                <Input label="Tanggal Check Out (Otomatis)" name="checkOut" type="date" value={data.checkOut} readOnly className="bg-gray-600" />
                <fieldset className="border border-gray-500 p-3 rounded-md">
                    <legend className="text-sm font-medium text-gray-300 px-1">Jumlah Kamar</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                        <Input label="Quad" name="quad" type="number" min="0" value={data.rooms.quad} onChange={(e) => handleEditOrderDataChange(hotelType, 'quad', parseInt(e.target.value))} />
                        <Input label="Triple" name="triple" type="number" min="0" value={data.rooms.triple} onChange={(e) => handleEditOrderDataChange(hotelType, 'triple', parseInt(e.target.value))} />
                        <Input label="Double" name="double" type="number" min="0" value={data.rooms.double} onChange={(e) => handleEditOrderDataChange(hotelType, 'double', parseInt(e.target.value))} />
                    </div>
                </fieldset>
            </div>
        </Card>
    );
  };
  
  const renderHotelEditForm = (currentEditableData: Partial<HotelBookingData>): React.ReactNode => { 
    return (
      <Card title="Edit Detail Hotel Pesanan" className="my-4 bg-gray-700">
        <div className="p-4 space-y-4">
            <Input label="Nama Pemesan*" name="customerName" value={currentEditableData.customerName || ''} onChange={(e) => handleEditOrderDataChange('main', 'customerName', e.target.value)} required />
            <Input label="Nama PPIU/PIHK" name="ppiuName" value={currentEditableData.ppiuName || ''} onChange={(e) => handleEditOrderDataChange('main', 'ppiuName', e.target.value)} />
            <Input label="No. Handphone*" name="phone" type="tel" value={currentEditableData.phone || ''} onChange={(e) => handleEditOrderDataChange('main', 'phone', e.target.value)} required />
            <Textarea label="Alamat" name="address" value={currentEditableData.address || ''} onChange={(e) => handleEditOrderDataChange('main', 'address', e.target.value)} />
            
            {renderHotelEditFormSection(currentEditableData.madinahHotel, 'madinahHotel', 'Hotel Madinah')}
            {renderHotelEditFormSection(currentEditableData.makkahHotel, 'makkahHotel', 'Hotel Mekah')}

            <Card title="Layanan Tambahan (Edit)" className="bg-gray-600">
                <div className="space-y-3 p-3">
                    <div className="flex items-center">
                        <input id="editIncludeHandling" name="includeHandling" type="checkbox" checked={currentEditableData.includeHandling || false} onChange={(e) => handleEditOrderDataChange('main', 'includeHandling', e.target.checked)} className="h-4 w-4 text-yellow-500 border-gray-500 rounded focus:ring-yellow-400 bg-gray-700" />
                        <label htmlFor="editIncludeHandling" className="ml-2 block text-sm text-gray-200">Include Handling Bandara</label>
                    </div>
                    {currentEditableData.includeHandling && <Input label="Jumlah Jemaah (Handling)" name="handlingPax" type="number" min="0" value={currentEditableData.handlingPax || 0} onChange={(e) => handleEditOrderDataChange('main', 'handlingPax', parseInt(e.target.value))} />}

                    <div className="flex items-center">
                        <input id="editIncludeVisa" name="includeVisa" type="checkbox" checked={currentEditableData.includeVisa || false} onChange={(e) => handleEditOrderDataChange('main', 'includeVisa', e.target.checked)} className="h-4 w-4 text-yellow-500 border-gray-500 rounded focus:ring-yellow-400 bg-gray-700" />
                        <label htmlFor="editIncludeVisa" className="ml-2 block text-sm text-gray-200">Include Visa</label>
                    </div>
                    {currentEditableData.includeVisa && (
                    <div className="ml-6 mt-2 space-y-3 p-3 border border-gray-500 rounded-md">
                        <Input label="Jumlah Jemaah (Visa)*" name="visaPax" type="number" min="1" value={currentEditableData.visaPax || ''} onChange={(e) => handleEditOrderDataChange('main', 'visaPax', parseInt(e.target.value))} required={currentEditableData.includeVisa} />
                        <Select label="Jenis Kendaraan (Visa)" name="visaVehicleType" value={currentEditableData.visaVehicleType || ''} onChange={(e) => handleEditOrderDataChange('main', 'visaVehicleType', e.target.value)} options={[{value: '', label: 'Pilih jenis'}, {value: 'Bus', label: 'Bus'}, {value: 'HiAce', label: 'HiAce'}, {value: 'SUV', label: 'SUV'}]} placeholder="Pilih Jenis Kendaraan" />
                        <Input label="Nama Maskapai (Visa)" name="visaAirlineName" value={currentEditableData.visaAirlineName || ''} onChange={(e) => handleEditOrderDataChange('main', 'visaAirlineName', e.target.value)} placeholder="Mis: Garuda Indonesia"/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input label="Tgl & Waktu Kedatangan (Visa)*" name="visaArrivalDate" type="datetime-local" value={currentEditableData.visaArrivalDate || ''} onChange={(e) => handleEditOrderDataChange('main', 'visaArrivalDate', e.target.value)} required={currentEditableData.includeVisa} />
                            <Input label="Tgl & Waktu Kepulangan (Visa)*" name="visaDepartureDate" type="datetime-local" value={currentEditableData.visaDepartureDate || ''} onChange={(e) => handleEditOrderDataChange('main', 'visaDepartureDate', e.target.value)} required={currentEditableData.includeVisa} />
                        </div>
                    </div>
                    )}
                </div>
            </Card>

            <div className="flex space-x-2 pt-3">
                <Button variant="primary" onClick={saveOrderDataChanges} isLoading={isSubmitting}>Simpan Perubahan</Button>
                <Button variant="outline" onClick={() => setIsEditingOrderData(false)} disabled={isSubmitting}>Batal</Button>
            </div>
        </div>
      </Card>
    );
  };
  const renderVisaDetails = (visaData: VisaBookingData) => (
    <>
        <DetailItemLocal label="Pemesan" value={visaData.customerName} />
        <DetailItemLocal label="PPIU" value={visaData.ppiuName} />
        <DetailItemLocal label="No. Handphone" value={visaData.phone} />
        <DetailItemLocal label="Alamat" value={visaData.address} />
        <DetailItemLocal label="Jumlah Pax" value={visaData.pax} />
        <DetailItemLocal label="Jenis Kendaraan" value={visaData.vehicleType || '-'} />
        <DetailItemLocal label="Nama Muasasah (Visa)" value={visaData.muasasahName || '-'} />
        {visaData.visaPricePerPaxUSD && visaData.pax && (order.status !== OrderStatus.REQUEST_CONFIRMATION || order.totalPrice) &&
            <DetailItemLocal label="Estimasi Biaya Visa" value={`${formatCurrency(visaData.visaPricePerPaxUSD * visaData.pax, 'USD')} (setara ${formatCurrency(convertToIDR(visaData.visaPricePerPaxUSD * visaData.pax, 'USD'), 'IDR')})`} />
        }
        {visaData.busPriceTotalSAR && visaData.busPriceTotalSAR > 0 && (order.status !== OrderStatus.REQUEST_CONFIRMATION || order.totalPrice) &&
             <DetailItemLocal label="Biaya Bus (Total)" value={`${formatCurrency(visaData.busPriceTotalSAR, 'SAR')} (setara ${formatCurrency(convertToIDR(visaData.busPriceTotalSAR, 'SAR'), 'IDR')})`} />
        }
    </>
  );
  const renderHandlingDetails = (handlingData: HandlingBookingData) => (
    <>
        <DetailItemLocal label="Pemesan" value={handlingData.customerName} />
        <DetailItemLocal label="PPIU/PIHK" value={handlingData.ppiuName || '-'} />
        <DetailItemLocal label="No. Handphone" value={handlingData.phone || '-'} />
        <DetailItemLocal label="Alamat" value={handlingData.address || '-'} />
        <DetailItemLocal label="Jumlah Jemaah" value={handlingData.pax || 0} />
        <DetailItemLocal label="Include Mutowif" value={handlingData.includeMutowif ? `Ya (${handlingData.mutowifName || 'Belum Dipilih'})` : 'Tidak'} />
        {handlingData.handlingPricePerPaxSAR && handlingData.pax && (order.status !== OrderStatus.REQUEST_CONFIRMATION || order.totalPrice) &&
             <DetailItemLocal label="Estimasi Biaya Handling" value={`${formatCurrency(handlingData.handlingPricePerPaxSAR * handlingData.pax, 'SAR')} (setara ${formatCurrency(convertToIDR(handlingData.handlingPricePerPaxSAR * handlingData.pax, 'SAR'), 'IDR')})`} />
        }
    </>
  );
  
  const renderJastipDetails = (jastipData: JastipBookingData): React.ReactNode => (
    <>
        <DetailItemLocal label="Pemesan (Jastip)" value={jastipData.customerName} />
        <DetailItemLocal label="No. Handphone (Jastip)" value={jastipData.phone} />
        <DetailItemLocal label="Jenis Titipan" value={jastipData.itemType} />
        <DetailItemLocal label="Jumlah" value={`${jastipData.quantity} ${jastipData.unit}`} />
        <DetailItemLocal label="Alamat Kirim" value={jastipData.deliveryAddress} />
        <DetailItemLocal label="Catatan" value={jastipData.notes || '-'} />
    </>
  );
  
  const renderPackageInfoEditForm = (): React.ReactNode => {
    const vehicleOptionsForSelect = [
        { value: '', label: 'Pilih Kendaraan' },
        ...availableVehicles.map(v => ({ value: v.id, label: `${v.name} (${v.type} - ${v.plateNumber})` }))
    ];
    return (
    <Card title="Edit Informasi Paket" className="my-6 bg-gray-700">
        <form className="space-y-4 p-4" onSubmit={(e) => { e.preventDefault(); handleSavePackageInfo(); }}>
            <Input label="Nama PPIU/PIHK" name="ppiuName" value={packageInfoForm.ppiuName} onChange={handlePackageInfoFormChange} />
            <Input label="No. Telpon PPIU" name="ppiuPhone" type="tel" value={packageInfoForm.ppiuPhone} onChange={handlePackageInfoFormChange} />
            <Input label="Jumlah Jemaah (Pax)" name="paxCount" type="number" min="0" value={packageInfoForm.paxCount || ''} onChange={handlePackageInfoFormChange} />
            <Textarea label="Info Hotel Madinah (Teks)" name="madinahHotelInfo" value={packageInfoForm.madinahHotelInfo} onChange={handlePackageInfoFormChange} placeholder="Contoh: Hotel Hilton Madinah, 3 malam, 2 kamar Quad"/>
            <Textarea label="Info Hotel Mekah (Teks)" name="makkahHotelInfo" value={packageInfoForm.makkahHotelInfo} onChange={handlePackageInfoFormChange} placeholder="Contoh: Hotel Fairmont Mekah, 4 malam, 2 kamar Quad"/>
            
            <h3 className="text-lg font-semibold text-yellow-400 pt-2 border-t border-gray-600 mt-3">Informasi Bus Utama</h3>
            <Select 
                label="Pilih Kendaraan Bus Utama" 
                name="busVehicleId" 
                value={packageInfoForm.busVehicleId || ''} 
                onChange={handlePackageInfoFormChange} 
                options={vehicleOptionsForSelect} 
                disabled={!canUserModifyDetails && userRole === 'customer'}
            />
             {packageInfoForm.busVehicleId && (
                <div className="p-3 bg-gray-600 rounded-md text-sm space-y-1">
                    <p><strong>Nama Bus Terpilih:</strong> {packageInfoForm.busName || '-'}</p>
                    <p><strong>Jenis Kendaraan:</strong> {packageInfoForm.busVehicleType || '-'}</p>
                    <p><strong>Nama Driver:</strong> {packageInfoForm.busDriverName || '-'}</p>
                    <p><strong>No. HP Driver:</strong> {packageInfoForm.busDriverPhone || '-'}</p>
                </div>
            )}
            <Input 
                label="Nama Bus (Otomatis dari Pilihan)" 
                name="busNameDisplay" 
                value={packageInfoForm.busName || '-'} 
                readOnly 
                className="bg-gray-600 cursor-not-allowed" 
            />
            <Input label="Nomor Syarikah Bus Utama" name="busSyarikahNumber" value={packageInfoForm.busSyarikahNumber || ''} onChange={handlePackageInfoFormChange} 
                readOnly={!canUserModifyDetails && userRole === 'customer'}
                className={(!canUserModifyDetails && userRole === 'customer') ? "bg-gray-600 cursor-not-allowed" : ""}
            />
            
            <fieldset className="border border-gray-600 p-3 rounded-md">
                <legend className="text-lg font-semibold text-yellow-400 px-1">Rute Perjalanan Bus</legend>
                {(packageInfoForm.busRoutes || []).map((route, index) => (
                    <div key={index} className="mb-3 p-3 border border-gray-500 rounded-md space-y-2 relative">
                        <h4 className="text-md font-medium text-gray-200">Rute {index + 1}</h4>
                        <Input label={`Tanggal Rute`} type="date" value={route.date} onChange={(e) => handleBusRouteChangePackageInfo(index, 'date', e.target.value)} 
                            readOnly={!canUserModifyDetails && userRole === 'customer'}
                            className={(!canUserModifyDetails && userRole === 'customer') ? "bg-gray-600 cursor-not-allowed" : ""}
                        />
                        <Input label="Dari" value={route.from} onChange={(e) => handleBusRouteChangePackageInfo(index, 'from', e.target.value)} 
                            readOnly={!canUserModifyDetails && userRole === 'customer'}
                            className={(!canUserModifyDetails && userRole === 'customer') ? "bg-gray-600 cursor-not-allowed" : ""}
                        />
                        <Input label="Ke" value={route.to} onChange={(e) => handleBusRouteChangePackageInfo(index, 'to', e.target.value)} 
                            readOnly={!canUserModifyDetails && userRole === 'customer'}
                            className={(!canUserModifyDetails && userRole === 'customer') ? "bg-gray-600 cursor-not-allowed" : ""}
                        />
                        <Select 
                            label="Kendaraan untuk Rute Ini"
                            name={`routeVehicleId_${index}`}
                            value={route.routeVehicleId || ''}
                            onChange={(e) => handleBusRouteChangePackageInfo(index, 'routeVehicleId', e.target.value)}
                            options={vehicleOptionsForSelect}
                            placeholder="Pilih Kendaraan Rute"
                            disabled={!canUserModifyDetails && userRole === 'customer'}
                            className={(!canUserModifyDetails && userRole === 'customer') ? "!bg-gray-600 !text-gray-400 cursor-not-allowed" : ""}
                        />
                        {route.vehicleDetails && <p className="text-xs text-gray-300 bg-gray-500 p-1.5 rounded">Detail Kendaraan Rute: {route.vehicleDetails}</p>}

                        {canUserModifyDetails && (
                            <Button type="button" onClick={() => handleRemoveBusRoutePackageInfo(index)} variant="danger" size="sm" className="absolute top-2 right-2 !p-1">
                                <TrashIcon className="h-4 w-4"/>
                            </Button>
                        )}
                    </div>
                ))}
                {canUserModifyDetails && (
                    <Button type="button" onClick={handleAddBusRoutePackageInfo} variant="outline" size="sm">Tambah Rute Bus</Button>
                )}
            </fieldset>

            <h3 className="text-lg font-semibold text-yellow-400 pt-2 border-t border-gray-600 mt-3">Kontak & Penerbangan</h3>
            <Select label="Nama Mutowif" name="mutowifName" value={packageInfoForm.mutowifName || ''} onChange={handlePackageInfoFormChange} options={[{value: '', label: 'Pilih Mutowif'}, ...MOCK_MUTOWIFS.map(m => ({value: m.name, label: m.name}))]} 
                disabled={!canUserModifyDetails && userRole === 'customer'} className={(!canUserModifyDetails && userRole === 'customer') ? "!bg-gray-600 !text-gray-400 cursor-not-allowed" : ""}
            />
            <Input label="No. Tlp Mutowif" name="mutowifPhone" type="tel" value={packageInfoForm.mutowifPhone || ''} onChange={handlePackageInfoFormChange} 
                readOnly={!canUserModifyDetails && userRole === 'customer'} className={(!canUserModifyDetails && userRole === 'customer') ? "bg-gray-600 cursor-not-allowed" : ""}
            />
            <Input label="Nama Perwakilan Saudi" name="representativeName" value={packageInfoForm.representativeName || ''} onChange={handlePackageInfoFormChange} 
                readOnly={!canUserModifyDetails && userRole === 'customer'} className={(!canUserModifyDetails && userRole === 'customer') ? "bg-gray-600 cursor-not-allowed" : ""}
            />
            <Input label="No. Tlp Perwakilan Saudi" name="representativePhone" type="tel" value={packageInfoForm.representativePhone || ''} onChange={handlePackageInfoFormChange} 
                readOnly={!canUserModifyDetails && userRole === 'customer'} className={(!canUserModifyDetails && userRole === 'customer') ? "bg-gray-600 cursor-not-allowed" : ""}
            />
            <Input label="No. Tlp Ewako Royal (PIC Saudi)" name="ewakoRoyalPhone" type="tel" value={packageInfoForm.ewakoRoyalPhone || ''} onChange={handlePackageInfoFormChange} 
                 readOnly={!canUserModifyDetails && userRole === 'customer'} className={(!canUserModifyDetails && userRole === 'customer') ? "bg-gray-600 cursor-not-allowed" : ""}
            />
            <Input label="Nama Maskapai" name="airlineName" value={packageInfoForm.airlineName || ''} onChange={handlePackageInfoFormChange} 
                readOnly={!canUserModifyDetails && userRole === 'customer'} className={(!canUserModifyDetails && userRole === 'customer') ? "bg-gray-600 cursor-not-allowed" : ""}
            />
            <Input label="Kode Penerbangan" name="airlineCode" value={packageInfoForm.airlineCode || ''} onChange={handlePackageInfoFormChange} 
                readOnly={!canUserModifyDetails && userRole === 'customer'} className={(!canUserModifyDetails && userRole === 'customer') ? "bg-gray-600 cursor-not-allowed" : ""}
            />
            <Input label="Tgl & Waktu Kedatangan Saudi" name="arrivalDateTime" type="datetime-local" value={packageInfoForm.arrivalDateTime || ''} onChange={handlePackageInfoFormChange} 
                readOnly={!canUserModifyDetails && userRole === 'customer'} className={(!canUserModifyDetails && userRole === 'customer') ? "bg-gray-600 cursor-not-allowed" : ""}
            />
            <Input label="Tgl & Waktu Kepulangan (dari Saudi)" name="departureDateTime" type="datetime-local" value={packageInfoForm.departureDateTime || ''} onChange={handlePackageInfoFormChange} 
                readOnly={!canUserModifyDetails && userRole === 'customer'} className={(!canUserModifyDetails && userRole === 'customer') ? "bg-gray-600 cursor-not-allowed" : ""}
            />

            <div className="flex justify-end space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditingPackageInfo(false)} disabled={isSubmitting}>Batal</Button>
                {canUserModifyDetails && (
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>Simpan Info Paket</Button>
                )}
            </div>
        </form>
    </Card>
  );
  };
  
  const renderManifestFormModal = (): React.ReactNode => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]"> 
        <Card 
            title={currentEditingManifestItem ? "Edit Item Manifest" : "Tambah Item Manifest"} 
            className="bg-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto" 
        >
            <form onSubmit={(e) => { e.preventDefault(); handleSaveManifestItem(); }} className="space-y-3 p-1"> 
                <Input label="Nama Jemaah*" name="namaJemaah" value={manifestItemForm.namaJemaah} onChange={handleManifestItemFormChange} required />
                <Select
                    label="Jenis Kelamin*"
                    name="jenisKelamin"
                    value={manifestItemForm.jenisKelamin}
                    onChange={handleManifestItemFormChange}
                    options={[
                        { value: '', label: 'Pilih Jenis Kelamin' },
                        { value: 'Laki-laki', label: 'Laki-laki' },
                        { value: 'Perempuan', label: 'Perempuan' },
                    ]}
                    required
                />
                <Input label="Tanggal Lahir*" name="tanggalLahir" type="date" value={manifestItemForm.tanggalLahir} onChange={handleManifestItemFormChange} required />
                <p className="text-sm text-gray-400">Usia: {manifestItemAge !== undefined ? `${manifestItemAge} tahun` : 'Mohon isi tanggal lahir'}</p>
                
                <Input label="Nomor Visa" name="nomorVisa" value={manifestItemForm.nomorVisa || ''} onChange={handleManifestItemFormChange} />
                <Input label="Nama Sesuai Paspor*" name="namaDiPaspor" value={manifestItemForm.namaDiPaspor} onChange={handleManifestItemFormChange} required />
                <Input label="Nomor Paspor*" name="nomorPaspor" value={manifestItemForm.nomorPaspor} onChange={handleManifestItemFormChange} required />
                <Input label="Tanggal Terbit Paspor*" name="tanggalTerbitPaspor" type="date" value={manifestItemForm.tanggalTerbitPaspor} onChange={handleManifestItemFormChange} required />
                <Input label="Tanggal Expired Paspor*" name="tanggalExpiredPaspor" type="date" value={manifestItemForm.tanggalExpiredPaspor} onChange={handleManifestItemFormChange} required />
                <Input label="Kota Tempat Issued Paspor" name="kotaTempatIssuedPaspor" value={manifestItemForm.kotaTempatIssuedPaspor || ''} onChange={handleManifestItemFormChange} />

                <div className="flex justify-end space-x-2 pt-3">
                    <Button type="button" variant="outline" onClick={handleCloseManifestForm} disabled={isSubmitting}>Batal</Button>
                    <Button type="submit" variant="primary" isLoading={isSubmitting}>
                        {currentEditingManifestItem ? "Update Item" : "Simpan Item"}
                    </Button>
                </div>
            </form>
        </Card>
    </div>
  );

const renderCostBreakdown = (currentOrder: Order): React.ReactNode => {
    if (!currentOrder.totalPrice || currentOrder.totalPrice === 0) {
        if (currentOrder.status === OrderStatus.REQUEST_CONFIRMATION && (!currentOrder.totalPrice || currentOrder.totalPrice === 0)) {
            return (
                <Card title="Rincian Biaya Estimasi" className="mt-6 bg-gray-800">
                    <p className="text-gray-400">Harga belum ditetapkan oleh Admin.</p>
                </Card>
            );
        }
    }

    const orderData = currentOrder.data as any;
    const costItems: Array<{label: string, valueSAR?: number, valueUSD?: number, valueIDR: number}> = [];
    let runningTotalSAR = 0;
    let runningTotalUSD = 0;

    const addCostItem = (label: string, amount: number, currency: 'SAR' | 'USD') => {
        const amountIDR = convertToIDR(amount, currency);
        if (currency === 'SAR') {
            costItems.push({ label, valueSAR: amount, valueIDR: amountIDR });
            runningTotalSAR += amount;
        } else {
            costItems.push({ label, valueUSD: amount, valueIDR: amountIDR });
            runningTotalUSD += amount;
        }
    };

    if (currentOrder.serviceType === ServiceType.HOTEL) {
        const hotelData = orderData as HotelBookingData;
        
        const processHotelCosts = (hotelInfo: HotelInfo | undefined, prefix: string) => {
            if (hotelInfo && hotelInfo.name && hotelInfo.pricesSAR) {
                const prices = hotelInfo.pricesSAR;
                if (hotelInfo.rooms.quad > 0 && prices.quad) {
                    addCostItem(`${prefix} - Quad (${hotelInfo.rooms.quad}k x ${hotelInfo.nights}m)`, prices.quad * hotelInfo.nights * hotelInfo.rooms.quad, 'SAR');
                }
                if (hotelInfo.rooms.triple > 0 && prices.triple) {
                    addCostItem(`${prefix} - Triple (${hotelInfo.rooms.triple}k x ${hotelInfo.nights}m)`, prices.triple * hotelInfo.nights * hotelInfo.rooms.triple, 'SAR');
                }
                if (hotelInfo.rooms.double > 0 && prices.double) {
                    addCostItem(`${prefix} - Double (${hotelInfo.rooms.double}k x ${hotelInfo.nights}m)`, prices.double * hotelInfo.nights * hotelInfo.rooms.double, 'SAR');
                }
            }
        };
        processHotelCosts(hotelData.madinahHotel, "Hotel Madinah");
        processHotelCosts(hotelData.makkahHotel, "Hotel Mekah");

        if (hotelData.includeVisa && hotelData.visaPricePerPaxUSD && hotelData.visaPax) {
            addCostItem(`Visa (${hotelData.visaPax} pax)`, hotelData.visaPricePerPaxUSD * hotelData.visaPax, 'USD');
        }
        if (hotelData.includeHandling && hotelData.handlingPricePerPaxSAR && hotelData.handlingPax) {
            addCostItem(`Handling (${hotelData.handlingPax} pax)`, hotelData.handlingPricePerPaxSAR * hotelData.handlingPax, 'SAR');
        }
        if (hotelData.busPriceTotalSAR && hotelData.busPriceTotalSAR > 0) {
            addCostItem('Bus (Paket)', hotelData.busPriceTotalSAR, 'SAR');
        }
    } else if (currentOrder.serviceType === ServiceType.VISA) {
        const visaData = orderData as VisaBookingData;
        if (visaData.visaPricePerPaxUSD && visaData.pax) {
            addCostItem(`Visa (${visaData.pax} pax)`, visaData.visaPricePerPaxUSD * visaData.pax, 'USD');
        }
        if (visaData.busPriceTotalSAR && visaData.busPriceTotalSAR > 0) {
            addCostItem('Bus (Paket)', visaData.busPriceTotalSAR, 'SAR');
        }
    } else if (currentOrder.serviceType === ServiceType.HANDLING) {
        const handlingData = orderData as HandlingBookingData;
        if (handlingData.handlingPricePerPaxSAR && handlingData.pax) {
            addCostItem(`Handling (${handlingData.pax} pax)`, handlingData.handlingPricePerPaxSAR * handlingData.pax, 'SAR');
        }
    }

    if (costItems.length === 0 && currentOrder.totalPrice) { 
         return (
            <Card title="Rincian Biaya Estimasi" className="mt-6 bg-gray-800">
                 <p className="text-gray-400">Detail rincian biaya tidak tersedia. Total: {formatCurrency(currentOrder.totalPrice, 'IDR')}</p>
            </Card>
        );
    } else if (costItems.length === 0) {
         return null; // Don't show cost breakdown if no items and no total price
    }


    return (
        <Card title="Rincian Biaya Estimasi" className="mt-6 bg-gray-800">
            <div className="space-y-2">
                {costItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-gray-700 last:border-b-0">
                        <span className="text-gray-300">{item.label}</span>
                        <span className="text-white font-medium text-right">
                            {item.valueSAR !== undefined && `${formatCurrency(item.valueSAR, 'SAR')}`}
                            {item.valueUSD !== undefined && `${formatCurrency(item.valueUSD, 'USD')}`}
                            <br/>
                            <span className="text-xs text-gray-400">(Setara {formatCurrency(item.valueIDR, 'IDR')})</span>
                        </span>
                    </div>
                ))}
            </div>
            {(runningTotalSAR > 0 || runningTotalUSD > 0) && (
                <div className="mt-4 pt-3 border-t border-gray-600 space-y-1 text-sm">
                    {runningTotalSAR > 0 && <p className="flex justify-between"><span>Subtotal Estimasi (SAR):</span> <span className="font-medium">{formatCurrency(runningTotalSAR, 'SAR')}</span></p>}
                    {runningTotalUSD > 0 && <p className="flex justify-between"><span>Subtotal Estimasi (USD):</span> <span className="font-medium">{formatCurrency(runningTotalUSD, 'USD')}</span></p>}
                    <p className="text-xs text-gray-400 mt-1">Kurs Estimasi: 1 USD = {formatCurrency(MOCK_EXCHANGE_RATES.USD_TO_IDR, 'IDR', true, 0)}, 1 SAR = {formatCurrency(MOCK_EXCHANGE_RATES.SAR_TO_IDR, 'IDR', true, 0)}</p>
                </div>
            )}
            <div className="mt-4 pt-3 border-t border-gray-600">
                <p className="flex justify-between text-lg font-bold">
                    <span>Grand Total Estimasi (IDR):</span>
                    <span className="metallic-gold-text">{formatCurrency(currentOrder.totalPrice, 'IDR')}</span>
                </p>
            </div>
        </Card>
    );
};


  return (
    <Layout>
      {showManifestFormModal && renderManifestFormModal()}
      {showChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[70]">
            <Card title={`Chat untuk Order ID: ${order.id.substring(0,8)}`} className="bg-gray-800 w-full max-w-lg h-[70vh] flex flex-col">
                <div className="absolute top-3 right-3">
                    <Button onClick={() => setShowChatModal(false)} variant="danger" size="sm" className="!p-1.5">X</Button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-900 rounded-t-md">
                    {isLoadingChatMessages ? <LoadingSpinner/> :
                        chatMessages.length === 0 ? <p className="text-gray-400 text-center">Belum ada pesan.</p> :
                        chatMessages.map(msg => <ChatMessageBubble key={msg.id} message={msg} currentUserId={currentAuthUserId!} />) 
                    }
                    <div ref={chatMessagesEndRef} />
                </div>
                <ChatInput onSendMessage={handleSendChatMessage} isLoading={isSendingChatMessage} />
            </Card>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
         <button onClick={() => navigate(userRole === 'admin' ? '/admin/orders' : '/orders')} className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors">
            <ArrowLeftIcon className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold metallic-gold-text">Detail Pesanan</h1>
         <Button onClick={handleOpenChatModal} variant="outline" size="sm" className="ml-auto">
            <ChatBubbleLeftEllipsisIcon className="h-5 w-5 mr-2" /> Chat
        </Button>
      </div>
      
      {error && <p className="text-red-400 bg-red-900 p-3 rounded-md mb-4">{error}</p>}

      <Card title={`Order ID: ${order.id.substring(0,12)}...`} className="mb-6 bg-gray-800">
          <dl className="divide-y divide-gray-700">
            <DetailItemLocal label="Jenis Layanan" value={order.serviceType} /> 
            <DetailItemLocal label="Status Pesanan" value={order.status} /> 
            <DetailItemLocal label="Harga Total Paket" value={order.totalPrice !== undefined && (order.status !== OrderStatus.REQUEST_CONFIRMATION || order.totalPrice > 0) ? formatCurrency(order.totalPrice, 'IDR') : 'Belum Ditetapkan Admin'} />
            <DetailItemLocal label="Tanggal Pesan" value={new Date(order.createdAt).toLocaleString('id-ID')} /> 
            <DetailItemLocal label="Terakhir Update" value={new Date(order.updatedAt).toLocaleString('id-ID')} />
            {order.serviceType === ServiceType.HOTEL && renderHotelDetails(data as HotelBookingData)} 
            {order.serviceType === ServiceType.VISA && renderVisaDetails(data as VisaBookingData)} 
            {order.serviceType === ServiceType.HANDLING && renderHandlingDetails(data as HandlingBookingData)} 
            {order.serviceType === ServiceType.JASTIP && renderJastipDetails(data as JastipBookingData)}
          </dl>
          {order.status === OrderStatus.TENTATIVE_CONFIRMATION && userRole === 'customer' && (
             <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-yellow-400 mb-2">Admin telah menetapkan harga. Mohon konfirmasi pesanan Anda.</p>
                <div className="flex space-x-2">
                    <Button onClick={() => handleCustomerConfirmation(true)} isLoading={isSubmitting} variant="primary">Konfirmasi & Lanjutkan</Button>
                    <Button onClick={() => handleCustomerConfirmation(false)} isLoading={isSubmitting} variant="danger">Tolak Pesanan</Button>
                </div>
            </div>
          )}
          {order.serviceType === ServiceType.HOTEL && canEditOrderDataByUser && !isEditingOrderData && (
             <Button onClick={() => { setEditableOrderData(order.data as HotelBookingData); setIsEditingOrderData(true); }} variant="outline" size="sm" className="mt-4">
                <PencilIcon className="h-4 w-4 mr-1" /> Ubah Detail Hotel
            </Button>
          )}
          {order.serviceType === ServiceType.HOTEL && isEditingOrderData && renderHotelEditForm(editableOrderData as HotelBookingData)}
      </Card>
      
      {order && (order.totalPrice && order.totalPrice > 0 || order.status !== OrderStatus.REQUEST_CONFIRMATION) && renderCostBreakdown(order)}

      {isEditingPackageInfo ? renderPackageInfoEditForm() : (
        <div className="mb-6">
            <PackageInfoDisplay packageInfo={order.packageInfo} />
            {userRole === 'customer' && canUserModifyDetails && (
                <Button onClick={handleEditPackageInfoClick} variant="outline" className="mt-4">
                    <PencilIcon className="h-4 w-4 mr-1" /> 
                    {order.packageInfo && Object.keys(order.packageInfo).length > 0 ? 'Ubah' : 'Lengkapi'} Informasi Paket Tambahan
                </Button>
            )}
        </div>
      )}

      {userRole === 'customer' && (
      <Card title="Manifest Jemaah" className="mb-6 bg-gray-800">
        {(order.manifest || []).length === 0 && <p className="text-gray-400 mb-3">Belum ada data manifest jemaah. Silakan tambahkan.</p>}
        {(order.manifest || []).map(item => (
            <div key={item.id} className="mb-3 p-3 border border-gray-700 rounded-md bg-gray-750">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-white">{item.namaJemaah} ({item.jenisKelamin?.charAt(0)}, {item.usia} th)</p>
                        <p className="text-sm text-gray-300">Paspor: {item.nomorPaspor} (Exp: {formatDateForDisplay(item.tanggalExpiredPaspor)})</p>
                        <p className="text-sm text-gray-300">Visa: {item.nomorVisa || '-'}</p>
                    </div>
                    {canUserModifyDetails && (
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenManifestForm(item)} className="!p-1.5"><PencilIcon className="h-4 w-4"/></Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteManifestItem(item.id)} className="!p-1.5"><TrashIcon className="h-4 w-4"/></Button>
                        </div>
                    )}
                </div>
            </div>
        ))}
        {canUserModifyDetails && (
            <Button onClick={() => handleOpenManifestForm()} variant="primary" size="sm" className="mt-3">
                <PlusCircleIcon className="h-5 w-5 mr-1"/> Tambah Data Manifest
            </Button>
        )}
      </Card>
      )}

      <Card title="Dokumen Pesanan" className="bg-gray-800">
        <div className="flex flex-wrap gap-2">
            <Button onClick={() => generateOrderRequestPdf(order)} variant="secondary" size="sm">Surat Permintaan Pesanan (PDF)</Button>
            {order.totalPrice && (order.status !== OrderStatus.REQUEST_CONFIRMATION || order.totalPrice > 0) && <Button onClick={() => generateInvoicePdf(order)} variant="secondary" size="sm">Invoice (PDF)</Button>}
            {order.packageInfo && <Button onClick={() => generatePackageInfoPdf(order)} variant="secondary" size="sm">Informasi Paket (PDF)</Button>}
        </div>
      </Card>

    </Layout>
  );
};

export default OrderDetailsPage;
