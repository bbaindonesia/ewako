import React from 'react';
import { Layout } from '../components/Layout';
import { ServiceWidget } from '../components/ServiceWidget';
import { NeonClockWidget } from '../components/NeonClockWidget'; // Import NeonClockWidget
import { BuildingOffice2Icon, DocumentCheckIcon, TicketIcon, BriefcaseIcon, ShoppingBagIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid'; // Added PaperAirplaneIcon

const services = [
  { title: "Pesan Hotel", icon: <BuildingOffice2Icon />, linkTo: "/book/hotel", description: "Akomodasi terbaik di Makkah & Madinah." },
  { title: "Pesan Visa", icon: <DocumentCheckIcon />, linkTo: "/book/visa", description: "Proses visa umroh & haji mudah." },
  { title: "Tiket Pesawat", icon: <PaperAirplaneIcon />, linkTo: "/book/flight", description: "Penerbangan domestik & internasional." }, // New Widget
  { title: "Tiket Kereta", icon: <TicketIcon />, linkTo: "/book/train", description: "Perjalanan antar kota suci yang nyaman." },
  { title: "Handling Bandara", icon: <BriefcaseIcon />, linkTo: "/book/handling", description: "Layanan kedatangan & keberangkatan." },
  { title: "Jasa Titipan (Jastip)", icon: <ShoppingBagIcon />, linkTo: "/jastip", description: "Titip barang aman & terpercaya." },
];

const HomePage: React.FC = () => {
  return (
    <Layout>
      <NeonClockWidget /> {/* Added NeonClockWidget here */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold metallic-gold-text mb-2">Selamat Datang di EWAKO ROYAL</h1>
        <p className="text-gray-300">Solusi lengkap perjalanan Umroh & Haji Anda.</p>
      </div>
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
       <div className="mt-12 p-6 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold metallic-gold-text mb-4">Mengapa Memilih EWAKO ROYAL?</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>Pelayanan Profesional & Amanah</li>
          <li>Harga Kompetitif dengan Fasilitas Premium</li>
          <li>Proses Pemesanan Mudah & Cepat</li>
          <li>Dukungan Pelanggan 24/7</li>
          <li>Integrasi WhatsApp untuk Notifikasi Real-time</li>
        </ul>
      </div>
    </Layout>
  );
};

export default HomePage;