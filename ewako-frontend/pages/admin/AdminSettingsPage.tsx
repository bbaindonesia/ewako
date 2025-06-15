
import React, { useState } from 'react';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [rekening, setRekening] = useState({ bank: 'BCA', nomor: '1234567890', nama: 'PT EWAKO ROYAL' });
  const [midtransApiKey, setMidtransApiKey] = useState('MIDTRANS_SERVER_KEY_ANDA'); // Placeholder

  const handleRekeningChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRekening({ ...rekening, [e.target.name]: e.target.value });
  };

  const handleSaveRekening = () => {
    // Mock save
    console.log("Saving rekening:", rekening);
    alert("Nomor rekening berhasil disimpan (simulasi).");
  };

  const handleSaveMidtransApi = () => {
    // Mock save
    console.log("Saving Midtrans API Key:", midtransApiKey);
    alert("API Key Midtrans berhasil disimpan (simulasi).");
  };


  return (
    <Layout>
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/admin')} className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors">
            <ArrowLeftIcon className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold metallic-gold-text">Pengaturan Admin</h1>
      </div>

      <div className="space-y-8">
        <Card title="Atur Nomor Rekening Pembayaran" className="bg-gray-800">
          <div className="space-y-4">
            <Input label="Nama Bank" name="bank" value={rekening.bank} onChange={handleRekeningChange} />
            <Input label="Nomor Rekening" name="nomor" value={rekening.nomor} onChange={handleRekeningChange} />
            <Input label="Atas Nama" name="nama" value={rekening.nama} onChange={handleRekeningChange} />
            <Button onClick={handleSaveRekening} variant="primary">Simpan Rekening</Button>
          </div>
        </Card>

        <Card title="Atur API Midtrans (Virtual Account)" className="bg-gray-800">
          <div className="space-y-4">
            <Input 
              label="Midtrans Server Key" 
              name="midtransApiKey" 
              type="password" 
              value={midtransApiKey} 
              onChange={(e) => setMidtransApiKey(e.target.value)} 
            />
            <p className="text-xs text-gray-400">Pastikan API Key ini aman dan benar untuk integrasi pembayaran Virtual Account.</p>
            <Button onClick={handleSaveMidtransApi} variant="primary">Simpan API Key Midtrans</Button>
          </div>
        </Card>

        <Card title="Ubah Profil Admin" className="bg-gray-800">
            <p className="text-gray-300 mb-2">Pengaturan profil admin dapat diakses melalui halaman Akun Saya.</p>
            <Button onClick={() => navigate('/account')} variant="outline">Buka Profil Admin</Button>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminSettingsPage;
