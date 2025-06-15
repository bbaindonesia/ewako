
import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { HandlingBookingData, ServiceType } from '../types';
import { MOCK_MUTOWIFS } from '../constants'; // Mutowifs are constant for now
import { sendOrderToWhatsApp } from '../services/whatsappService';
import { createOrder } from '../services/orderService'; // Updated import
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../App'; // Import useAuth
import { ApiErrorResponse } from '../services/api';

const mutowifOptions = MOCK_MUTOWIFS.map(m => ({ value: m.name, label: `${m.name} (${m.phone})` }));

const HandlingBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useAuth(); // Get userId from auth context
  const [formData, setFormData] = useState<HandlingBookingData>({
    customerName: '',
    ppiuName: '',
    phone: '',
    address: '',
    pax: 1,
    includeMutowif: false,
    mutowifName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'success' | 'error' | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked, mutowifName: checked ? prev.mutowifName : '' }));
    } else {
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'pax' ? Math.max(1, parseInt(value)) : value 
        }));
    }
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
      await createOrder(userId, ServiceType.HANDLING, formData);
      sendOrderToWhatsApp(ServiceType.HANDLING, formData);
      setSubmissionStatus('success');
      setSubmissionMessage('Pesanan handling Anda telah dikirim. Anda akan dialihkan.');
      setTimeout(() => navigate('/orders'), 3000);
    } catch (error) {
      console.error("Error submitting handling order:", error);
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
        <h1 className="text-2xl font-bold metallic-gold-text">Pesan Handling Bandara</h1>
      </div>

      {submissionStatus && (
        <div className={`${submissionStatus === 'success' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'} text-white px-4 py-3 rounded relative mb-4`} role="alert">
          <strong className="font-bold">{submissionStatus === 'success' ? 'Berhasil!' : 'Gagal!'} </strong>
          <span className="block sm:inline">{submissionMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Detail Pemesanan Handling" className="bg-gray-800">
          <div className="space-y-4">
            <Input label="Nama Pemesan*" name="customerName" value={formData.customerName} onChange={handleInputChange} required />
            <Input label="Nama PPIU/PIHK (Opsional)" name="ppiuName" value={formData.ppiuName || ''} onChange={handleInputChange} />
            <Input label="No. Handphone*" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="+628123456789" required />
            <Textarea label="Alamat" name="address" value={formData.address || ''} onChange={handleInputChange} />
            <Input label="Jumlah Jemaah*" name="pax" type="number" min="1" value={formData.pax} onChange={handleInputChange} required />
            
            <div className="flex items-center mt-2">
              <input id="includeMutowif" name="includeMutowif" type="checkbox" checked={formData.includeMutowif} onChange={handleInputChange} className="h-4 w-4 text-yellow-500 border-gray-500 rounded focus:ring-yellow-400 bg-gray-700" />
              <label htmlFor="includeMutowif" className="ml-2 block text-sm text-gray-200">Include Mutowif</label>
            </div>
            {formData.includeMutowif && (
              <Select label="Pilih Mutowif (Opsional)" name="mutowifName" value={formData.mutowifName || ''} onChange={handleInputChange} options={mutowifOptions} placeholder="Pilih Mutowif" />
            )}
          </div>
        </Card>
        
        <div className="pt-4">
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} fullWidth>
            Kirim Pesanan Handling
          </Button>
        </div>
      </form>
    </Layout>
  );
};

export default HandlingBookingPage;
