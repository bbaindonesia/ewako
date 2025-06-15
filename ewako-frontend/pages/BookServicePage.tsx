import React from 'react';
import { Layout } from '../components/Layout';
import { ServiceWidget } from '../components/ServiceWidget';
import { BuildingOffice2Icon, DocumentCheckIcon, TicketIcon, BriefcaseIcon, ShoppingBagIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid'; // Added PaperAirplaneIcon
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const services = [
  { title: "Pesan Hotel", icon: <BuildingOffice2Icon />, linkTo: "/book/hotel", description: "Akomodasi Makkah & Madinah." },
  { title: "Pesan Visa", icon: <DocumentCheckIcon />, linkTo: "/book/visa", description: "Visa umroh & haji." },
  { title: "Tiket Pesawat", icon: <PaperAirplaneIcon />, linkTo: "/book/flight", description: "Penerbangan." }, // New Widget
  { title: "Tiket Kereta", icon: <TicketIcon />, linkTo: "/book/train", description: "Antar kota suci." },
  { title: "Handling Bandara", icon: <BriefcaseIcon />, linkTo: "/book/handling", description: "Layanan bandara." },
  { title: "Jasa Titipan", icon: <ShoppingBagIcon />, linkTo: "/jastip", description: "Titip barang." },
];

const BookServicePage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Layout>
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors">
          <ArrowLeftIcon className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold metallic-gold-text">Pesan Layanan</h1>
      </div>
      <p className="text-gray-300 mb-8">Pilih layanan yang Anda butuhkan untuk perjalanan ibadah Anda.</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <ServiceWidget
            key={service.title}
            title={service.title}
            icon={service.icon}
            linkTo={service.linkTo}
            description={service.description}
          />
        ))}
      </div>
    </Layout>
  );
};

export default BookServicePage;