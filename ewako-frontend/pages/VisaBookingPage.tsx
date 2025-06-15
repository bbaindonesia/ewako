
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { VisaBookingData, ServiceType } from '../types';
import { sendOrderToWhatsApp } from '../services/whatsappService';
import { createOrder } from '../services/orderService'; // Updated import
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../App'; // Import useAuth
import { ApiErrorResponse } from '../services/api';

const vehicleOptions = [
  { value: 'Bus', label: 'Bus' },
  { value: 'HiAce', label: 'HiAce' },
  { value: 'SUV', label: 'SUV' },
];

const VisaBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useAuth(); // Get userId from auth context
  const [formData, setFormData] = useState<VisaBookingData>({
    customerName: '',
    ppiuName: '',
    phone: '',
    address: '',
    pax: 1,
    vehicleType: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'success' | 'error' | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState('');


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'pax' ? Math.max(1, parseInt(value)) : value 
    }));
  };

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

    if (!formData.customerName || !formData.phone || formData.pax <= 0) {
      setSubmissionStatus('error');
      setSubmissionMessage("Nama Pemesan, No. Handphone, dan Jumlah Jemaah wajib diisi dengan benar.");
      setIsLoading(false);
      return;
    }

    try {
      await createOrder(userId, ServiceType.VISA, formData);
      sendOrderToWhatsApp(ServiceType.VISA, formData);
      setSubmissionStatus('success');
      setSubmissionMessage('Pesanan visa Anda telah dikirim. Anda akan dialihkan.');
      setTimeout(() => navigate('/orders'), 3000);
    } catch (error) {
      console.error("Error submitting visa order:", error);
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
        <h1 className="text-2xl font-bold metallic-gold-text">Pesan Visa</h1>
      </div>

      {submissionStatus && (
        <div className={`${submissionStatus === 'success' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'} text-white px-4 py-3 rounded relative mb-4`} role="alert">
          <strong className="font-bold">{submissionStatus === 'success' ? 'Berhasil!' : 'Gagal!'} </strong>
          <span className="block sm:inline">{submissionMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Detail Pemesanan Visa" className="bg-gray-800">
          <div className="space-y-4">
            <Input label="Nama Pemesan*" name="customerName" value={formData.customerName} onChange={handleInputChange} required />
            <Input label="Nama PPIU/PIHK (Opsional)" name="ppiuName" value={formData.ppiuName || ''} onChange={handleInputChange} />
            <Input label="No. Handphone*" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="+628123456789" required />
            <Textarea label="Alamat" name="address" value={formData.address || ''} onChange={handleInputChange} />
            <Input label="Jumlah Jemaah*" name="pax" type="number" min="1" value={formData.pax} onChange={handleInputChange} required />
            <Select label="Jenis Kendaraan (Opsional)" name="vehicleType" value={formData.vehicleType} onChange={handleInputChange} options={vehicleOptions} placeholder="Pilih Jenis Kendaraan" />
          </div>
        </Card>
        
        <div className="pt-4">
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} fullWidth>
            Kirim Pesanan Visa
          </Button>
        </div>
      </form>
    </Layout>
  );
};

export default VisaBookingPage;
