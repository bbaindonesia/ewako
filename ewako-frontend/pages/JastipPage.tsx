
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { JastipBookingData, ServiceType, JastipItemType, JastipUnit } from '../types';
import { JASTIP_UNITS_MAP } from '../constants'; // Units map is constant
import { sendOrderToWhatsApp } from '../services/whatsappService';
import { createOrder } from '../services/orderService'; // Updated import
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../App'; // Import useAuth
import { ApiErrorResponse } from '../services/api';

const itemTypeOptions = Object.values(JastipItemType).map(type => ({ value: type, label: type }));

const JastipPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useAuth(); // Get userId from auth context
  const [formData, setFormData] = useState<JastipBookingData>({
    customerName: '',
    phone: '',
    itemType: '',
    unit: '',
    quantity: 1,
    deliveryAddress: '',
    notes: '',
  });
  const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'success' | 'error' | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState('');


  useEffect(() => {
    if (formData.itemType && JASTIP_UNITS_MAP[formData.itemType as JastipItemType]) {
      const units = JASTIP_UNITS_MAP[formData.itemType as JastipItemType] || [];
      setUnitOptions(units.map(u => ({ value: u, label: u })));
      if (!units.includes(formData.unit as JastipUnit)) {
        setFormData(prev => ({ ...prev, unit: units[0] || '' }));
      }
    } else {
      setUnitOptions([]);
      setFormData(prev => ({ ...prev, unit: '' }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.itemType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: name === 'quantity' ? Math.max(1, parseInt(value)) : value 
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

    if (!formData.customerName || !formData.phone || !formData.itemType || !formData.unit || formData.quantity <= 0 || !formData.deliveryAddress) {
      setSubmissionStatus('error');
      setSubmissionMessage("Semua field bertanda (*) wajib diisi dengan benar.");
      setIsLoading(false);
      return;
    }

    try {
      await createOrder(userId, ServiceType.JASTIP, formData);
      sendOrderToWhatsApp(ServiceType.JASTIP, formData);
      setSubmissionStatus('success');
      setSubmissionMessage('Pesanan Jastip Anda telah dikirim. Anda akan dialihkan.');
      setTimeout(() => navigate('/orders'), 3000);
    } catch (error) {
      console.error("Error submitting Jastip order:", error);
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
        <h1 className="text-2xl font-bold metallic-gold-text">Pesan Jasa Titipan (Jastip)</h1>
      </div>

      {submissionStatus && (
        <div className={`${submissionStatus === 'success' ? 'bg-green-600 border-green-700' : 'bg-red-600 border-red-700'} text-white px-4 py-3 rounded relative mb-4`} role="alert">
          <strong className="font-bold">{submissionStatus === 'success' ? 'Berhasil!' : 'Gagal!'} </strong>
          <span className="block sm:inline">{submissionMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Detail Pemesanan Jastip" className="bg-gray-800">
          <div className="space-y-4">
            <Input label="Nama Pemesan*" name="customerName" value={formData.customerName} onChange={handleInputChange} required />
            <Input label="No. Handphone*" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="+628123456789" required />
            <Select label="Jenis Titipan*" name="itemType" value={formData.itemType} onChange={handleInputChange} options={itemTypeOptions} placeholder="Pilih Jenis Titipan" required />
            
            <div className="grid grid-cols-2 gap-4">
                <Select label="Unit*" name="unit" value={formData.unit} onChange={handleInputChange} options={unitOptions} placeholder="Pilih Unit" disabled={!formData.itemType} required/>
                <Input label="Jumlah*" name="quantity" type="number" min="1" value={formData.quantity} onChange={handleInputChange} required />
            </div>

            <Textarea label="Alamat Tujuan Pengiriman (Indonesia)*" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleInputChange} required />
            <Textarea label="Pesan Untuk Pengantar (Opsional)" name="notes" value={formData.notes || ''} onChange={handleInputChange} />
          </div>
        </Card>
        
        <div className="pt-4">
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} fullWidth>
            Kirim Pesanan Jastip
          </Button>
        </div>
      </form>
    </Layout>
  );
};

export default JastipPage;
