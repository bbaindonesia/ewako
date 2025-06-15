
import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  return (
    <Layout>
      <div className="text-center py-20">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-3xl font-semibold metallic-gold-text mb-6">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-300 mb-8">
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg">
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </Layout>
  );
};

export default NotFoundPage;
