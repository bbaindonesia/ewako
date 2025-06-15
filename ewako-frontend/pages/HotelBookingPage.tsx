
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { HotelBookingData, ServiceType, HotelInfo, RoomBooking } from '../types';
import { sendOrderToWhatsApp } from '../services/whatsappService';
import { createOrder } from '../services/orderService'; // Updated import
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../App'; // Import useAuth
import { ApiErrorResponse } from '../services/api';

const initialHotelInfo: HotelInfo = { name: '', nights: 1, rooms: { quad: 0, triple: 0, double: 0 }, checkIn: '', checkOut: '' };

const vehicleOptions = [
  { value: 'Bus', label: 'Bus' },
  { value: 'HiAce', label: 'HiAce' },
  { value: 'SUV', label: 'SUV' },
];

interface HotelFormSectionProps {
  hotelType: 'madinahHotel' | 'makkahHotel';
  title: string;
  hotelData: HotelInfo;
  onHotelInfoChange: (hotelType: 'madinahHotel' | 'makkahHotel', field: keyof HotelInfo | keyof RoomBooking, value: string | number) => void;
}

const HotelFormSection: React.FC<HotelFormSectionProps> = React.memo(({ hotelType, title, hotelData, onHotelInfoChange }) => {
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onHotelInfoChange(hotelType, 'name', e.target.value);
  }, [hotelType, onHotelInfoChange]);

  const handleCheckInChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onHotelInfoChange(hotelType, 'checkIn', e.target.value);
  }, [hotelType, onHotelInfoChange]);

  const handleNightsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onHotelInfoChange(hotelType, 'nights', parseInt(e.target.value));
  }, [hotelType, onHotelInfoChange]);

  const handleRoomChange = useCallback((roomField: keyof RoomBooking, e: React.ChangeEvent<HTMLInputElement>) => {
    onHotelInfoChange(hotelType, roomField, parseInt(e.target.value));
  }, [hotelType, onHotelInfoChange]);


  return (
    <Card title={title} className="mb-6 bg-gray-800">
      <div className="space-y-4">
        <Input label="Nama Hotel" name="name" value={hotelData.name} onChange={handleNameChange} placeholder="Mis: Movenpick Anwar Al Madinah" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Tanggal Check In" name="checkIn" type="date" value={hotelData.checkIn} onChange={handleCheckInChange} />
          <Input label="Jumlah Malam" name="nights" type="number" min="1" value={hotelData.nights} onChange={handleNightsChange} />
        </div>
        <Input label="Tanggal Check Out (Otomatis)" name="checkOut" type="date" value={hotelData.checkOut} readOnly className="bg-gray-600" />
        
        <fieldset className="border border-gray-600 p-4 rounded-md">
          <legend className="text-sm font-medium text-gray-300 px-1">Jumlah Kamar</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <Input label="Quad" name="quad" type="number" min="0" value={hotelData.rooms.quad} onChange={(e) => handleRoomChange('quad', e)} />
            <Input label="Triple" name="triple" type="number" min="0" value={hotelData.rooms.triple} onChange={(e) => handleRoomChange('triple', e)} />
            <Input label="Double" name="double" type="number" min="0" value={hotelData.rooms.double} onChange={(e) => handleRoomChange('double', e)} />
          </div>
        </fieldset>
      </div>
    </Card>
  );
});


const HotelBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useAuth(); // Get userId from auth context
  const [formData, setFormData] = useState<HotelBookingData>({
    customerName: '',
    ppiuName: '',
    phone: '',
    address: '',
    madinahHotel: { ...initialHotelInfo },
    makkahHotel: { ...initialHotelInfo },
    includeHandling: false,
    handlingPax: 0,
    includeVisa: false,
    visaPax: 0,
    visaVehicleType: '',
    visaAirlineName: '',
    visaArrivalDate: '', 
    visaDepartureDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'success' | 'error' | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState('');


  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ 
        ...prev, 
        [name]: checked,
        ...(name === 'includeVisa' && !checked && { 
            visaPax: 0, 
            visaVehicleType: '', 
            visaAirlineName: '', 
            visaArrivalDate: '', 
            visaDepartureDate: '' 
        })
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleHotelInfoChange = useCallback((hotelType: 'madinahHotel' | 'makkahHotel', field: keyof HotelInfo | keyof RoomBooking, value: string | number) => {
    setFormData(prev => {
      const hotelToUpdate = prev[hotelType] ? { ...prev[hotelType] } : { ...initialHotelInfo };
      
      if (field === 'quad' || field === 'triple' || field === 'double') {
        hotelToUpdate.rooms = { ...hotelToUpdate.rooms, [field]: Math.max(0, Number(value)) };
      } else if (field === 'nights'){
        (hotelToUpdate as any)[field] = Math.max(1, Number(value));
      } else { 
        (hotelToUpdate as any)[field] = value;
      }
      
      return { 
        ...prev, 
        [hotelType]: hotelToUpdate 
      };
    });
  }, []);
  
  useEffect(() => {
    const calculateNewCheckout = (hotelInfo?: HotelInfo): string | undefined => {
      if (hotelInfo && hotelInfo.checkIn && hotelInfo.nights > 0) {
        const checkInDate = new Date(hotelInfo.checkIn);
        if (isNaN(checkInDate.getTime())) return undefined; 
        checkInDate.setDate(checkInDate.getDate() + hotelInfo.nights);
        return checkInDate.toISOString().split('T')[0];
      }
      return undefined;
    };

    setFormData(prev => {
      let madeChanges = false;
      const newFormData = { ...prev };

      if (newFormData.madinahHotel) {
        const newCheckout = calculateNewCheckout(newFormData.madinahHotel);
        if (newCheckout !== undefined && newFormData.madinahHotel.checkOut !== newCheckout) {
          newFormData.madinahHotel = { ...newFormData.madinahHotel, checkOut: newCheckout };
          madeChanges = true;
        }
      }

      if (newFormData.makkahHotel) {
        const newCheckout = calculateNewCheckout(newFormData.makkahHotel);
        if (newCheckout !== undefined && newFormData.makkahHotel.checkOut !== newCheckout) {
          newFormData.makkahHotel = { ...newFormData.makkahHotel, checkOut: newCheckout };
          madeChanges = true;
        }
      }

      if (madeChanges) {
        return newFormData;
      }
      return prev; 
    });
  }, [formData.madinahHotel?.checkIn, formData.madinahHotel?.nights, formData.makkahHotel?.checkIn, formData.makkahHotel?.nights]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmissionStatus(null);
    setSubmissionMessage('');

    if (!userId) {
      setSubmissionStatus('error');
      setSubmissionMessage("Anda harus login untuk membuat pesanan.");
      setIsLoading(false);
      return;
    }

    if (!formData.customerName || !formData.phone) {
      setSubmissionStatus('error');
      setSubmissionMessage("Nama Pemesan dan No. Handphone wajib diisi.");
      setIsLoading(false);
      return;
    }
    if (!formData.madinahHotel?.name && !formData.makkahHotel?.name) {
      setSubmissionStatus('error');
      setSubmissionMessage("Minimal satu hotel (Madinah atau Mekah) harus diisi.");
      setIsLoading(false);
      return;
    }
     if (formData.includeVisa) {
        if (!formData.visaPax || formData.visaPax <= 0) {
            setSubmissionStatus('error');
            setSubmissionMessage("Jumlah Jemaah (Visa) wajib diisi jika menyertakan visa.");
            setIsLoading(false);
            return;
        }
        if (!formData.visaArrivalDate || !formData.visaDepartureDate) {
            setSubmissionStatus('error');
            setSubmissionMessage("Tanggal & Waktu Kedatangan dan Kepulangan untuk visa wajib diisi.");
            setIsLoading(false);
            return;
        }
    }

    try {
      await createOrder(userId, ServiceType.HOTEL, formData);
      sendOrderToWhatsApp(ServiceType.HOTEL, formData); // This can remain as it's a client-side action
      setSubmissionStatus('success');
      setSubmissionMessage('Pesanan hotel Anda telah dikirim dan akan segera diproses. Anda akan dialihkan ke halaman Pesanan Saya.');
      setTimeout(() => navigate('/orders'), 3000); 
    } catch (error) {
      console.error("Error submitting order:", error);
      const apiError = error as ApiErrorResponse;
      setSubmissionStatus('error');
      setSubmissionMessage(apiError.message || "Terjadi kesalahan saat mengirim pesanan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors">
            <ArrowLeftIcon className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold metallic-gold-text">Pesan Hotel</h1>
      </div>

      {submissionStatus && (
        <div className={`${submissionStatus === 'success' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'} text-white px-4 py-3 rounded relative mb-4`} role="alert">
          <strong className="font-bold">{submissionStatus === 'success' ? 'Berhasil!' : 'Gagal!'} </strong>
          <span className="block sm:inline">{submissionMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card title="Informasi Pemesan" className="bg-gray-800">
          <div className="space-y-4">
            <Input label="Nama Pemesan*" name="customerName" value={formData.customerName} onChange={handleInputChange} required />
            <Input label="Nama PPIU/PIHK (Opsional)" name="ppiuName" value={formData.ppiuName || ''} onChange={handleInputChange} />
            <Input label="No. Handphone*" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="+628123456789" required />
            <Textarea label="Alamat" name="address" value={formData.address || ''} onChange={handleInputChange} />
          </div>
        </Card>

        <HotelFormSection 
            hotelType="madinahHotel" 
            title="Hotel Madinah" 
            hotelData={formData.madinahHotel || initialHotelInfo} 
            onHotelInfoChange={handleHotelInfoChange} 
        />
        <HotelFormSection 
            hotelType="makkahHotel" 
            title="Hotel Mekah" 
            hotelData={formData.makkahHotel || initialHotelInfo} 
            onHotelInfoChange={handleHotelInfoChange} 
        />

        <Card title="Layanan Tambahan" className="bg-gray-800">
          <div className="space-y-4">
            <div className="flex items-center">
              <input id="includeHandling" name="includeHandling" type="checkbox" checked={formData.includeHandling} onChange={handleInputChange} className="h-4 w-4 text-yellow-500 border-gray-500 rounded focus:ring-yellow-400 bg-gray-700" />
              <label htmlFor="includeHandling" className="ml-2 block text-sm text-gray-200">Include Handling Bandara</label>
            </div>
            {formData.includeHandling && <Input label="Jumlah Jemaah (Handling)" name="handlingPax" type="number" min="0" value={formData.handlingPax} onChange={handleInputChange} />}

            <div className="flex items-center">
              <input id="includeVisa" name="includeVisa" type="checkbox" checked={formData.includeVisa} onChange={handleInputChange} className="h-4 w-4 text-yellow-500 border-gray-500 rounded focus:ring-yellow-400 bg-gray-700" />
              <label htmlFor="includeVisa" className="ml-2 block text-sm text-gray-200">Include Visa</label>
            </div>
            {formData.includeVisa && (
              <div className="ml-6 mt-2 space-y-4 p-4 border border-gray-700 rounded-md">
                <Input label="Jumlah Jemaah (Visa)*" name="visaPax" type="number" min="1" value={formData.visaPax || ''} onChange={handleInputChange} required={formData.includeVisa} />
                <Select label="Jenis Kendaraan (Visa)" name="visaVehicleType" value={formData.visaVehicleType || ''} onChange={handleInputChange} options={vehicleOptions} placeholder="Pilih Jenis Kendaraan" />
                <Input label="Nama Maskapai (Visa)" name="visaAirlineName" value={formData.visaAirlineName || ''} onChange={handleInputChange} placeholder="Mis: Garuda Indonesia"/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Tgl & Waktu Kedatangan (Visa)*" name="visaArrivalDate" type="datetime-local" value={formData.visaArrivalDate || ''} onChange={handleInputChange} required={formData.includeVisa} />
                    <Input label="Tgl & Waktu Kepulangan (Visa)*" name="visaDepartureDate" type="datetime-local" value={formData.visaDepartureDate || ''} onChange={handleInputChange} required={formData.includeVisa} />
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="pt-4">
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} fullWidth>
            Kirim Pesanan Hotel
          </Button>
        </div>
      </form>
    </Layout>
  );
};

export default HotelBookingPage;
