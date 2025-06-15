
import React from 'react';
import { Layout } from '../../components/Layout';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { NeonClockWidget } from '../../components/NeonClockWidget'; // Import NeonClockWidget
import { Cog6ToothIcon, ClipboardDocumentListIcon, ChatBubbleLeftRightIcon, UserGroupIcon, CurrencyDollarIcon, TruckIcon, UsersIcon } from '@heroicons/react/24/solid';

const adminSections = [
  { title: "Kelola Pesanan", link: "/admin/orders", icon: <ClipboardDocumentListIcon className="h-8 w-8 text-yellow-500" />, description: "Lihat dan perbarui status semua pesanan." },
  { title: "Kelola Pengguna", link: "/admin/users", icon: <UsersIcon className="h-8 w-8 text-yellow-500" />, description: "Atur profil admin dan pemesan." },
  { title: "Atur Kendaraan", link: "/admin/vehicles", icon: <TruckIcon className="h-8 w-8 text-yellow-500" />, description: "Kelola daftar kendaraan untuk layanan." },
  { title: "Chat dengan Pemesan", link: "/admin/chat", icon: <ChatBubbleLeftRightIcon className="h-8 w-8 text-yellow-500" />, description: "Komunikasi langsung dengan pelanggan." }, 
  { title: "Pengaturan Pembayaran", link: "/admin/settings", icon: <CurrencyDollarIcon className="h-8 w-8 text-yellow-500" />, description: "Atur rekening dan integrasi Midtrans." }, 
  { title: "Pengaturan Aplikasi", link: "/admin/app-settings", icon: <Cog6ToothIcon className="h-8 w-8 text-yellow-500" />, description: "Konfigurasi umum aplikasi. (Segera)" }, 
];

const AdminDashboardPage: React.FC = () => {
  return (
    <Layout>
      <NeonClockWidget /> {/* Added NeonClockWidget here */}
      <h1 className="text-3xl font-bold metallic-gold-text mb-8">Admin Dashboard</h1>
      <p className="text-gray-300 mb-8">Selamat datang di area administrasi EWAKO ROYAL. Kelola semua aspek operasional aplikasi dari sini.</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map(section => (
          <Link key={section.title} to={section.link} className="block group">
            <Card className="bg-gray-800 hover:bg-gray-700 transition-all duration-300 ease-in-out transform group-hover:scale-105 h-full flex flex-col">
              <div className="flex flex-col items-center text-center p-6 flex-grow">
                <div className="mb-4">{section.icon}</div>
                <h2 className="text-xl font-semibold text-white mb-2">{section.title}</h2>
                <p className="text-sm text-gray-400">{section.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
};

export default AdminDashboardPage;
