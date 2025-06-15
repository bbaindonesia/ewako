import React from 'react';
import { Layout } from '../components/Layout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const FlightBookingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/book')} 
          className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="Kembali ke Pesan Layanan"
        >
          <ArrowLeftIcon className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold metallic-gold-text">Pesan Tiket Pesawat</h1>
      </div>
      <div className="text-center py-10">
        <svg className="mx-auto h-24 w-24 text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <h2 className="text-xl font-semibold text-white mb-3">Fitur Pemesanan Tiket Pesawat</h2>
        <p className="text-gray-400 mb-6">Segera Hadir! Kami sedang menyiapkan layanan pemesanan tiket pesawat terbaik untuk Anda.</p>
        <Button onClick={() => navigate('/')} variant="primary">
          Kembali ke Beranda
        </Button>
      </div>
    </Layout>
  );
};

export default FlightBookingPage;