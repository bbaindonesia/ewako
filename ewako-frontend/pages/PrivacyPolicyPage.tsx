
import React from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { APP_NAME } from '../constants';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeftIcon className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold metallic-gold-text">Kebijakan Privasi</h1>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-gray-300 space-y-4 text-sm">
        <p><strong>Terakhir Diperbarui:</strong> {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <p>Selamat datang di Kebijakan Privasi {APP_NAME}. Kami menghargai privasi Anda dan berkomitmen untuk melindungi informasi pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan menjaga informasi Anda ketika Anda menggunakan aplikasi web progresif (PWA) kami.</p>

        <h2 className="text-lg font-semibold metallic-gold-text pt-2">1. Informasi yang Kami Kumpulkan</h2>
        <p>Aplikasi {APP_NAME} saat ini beroperasi sebagai versi simulasi (mock) dan sebagian besar data disimpan secara lokal di perangkat Anda menggunakan penyimpanan browser (`localStorage`). Informasi yang mungkin kami kumpulkan meliputi:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li><strong>Informasi Pendaftaran:</strong> Nama, alamat email, nomor telepon, nama PPIU/PIHK, alamat, dan sandi (sandi disimpan dalam bentuk mock untuk simulasi login dan tidak di-hash dalam versi ini).</li>
          <li><strong>Data Pesanan:</strong> Detail layanan yang Anda pesan, seperti informasi hotel, detail visa, data handling, atau detail jasa titipan.</li>
          <li><strong>Informasi Kontak:</strong> Nomor telepon dan nama kontak yang Anda berikan untuk keperluan notifikasi atau pengisian informasi paket.</li>
          <li><strong>Data Manifest Jemaah:</strong> Nama jemaah, jenis kelamin, tanggal lahir, nomor visa, dan detail paspor yang Anda masukkan.</li>
          <li><strong>Informasi Perangkat (Otomatis):</strong> Kami mungkin mengumpulkan informasi non-pribadi seperti jenis browser, sistem operasi, dan data penggunaan umum untuk meningkatkan layanan. Dalam versi PWA ini, pengumpulan data otomatis diminimalkan.</li>
        </ul>

        <h2 className="text-lg font-semibold metallic-gold-text pt-2">2. Bagaimana Kami Menggunakan Informasi Anda</h2>
        <p>Informasi Anda digunakan untuk tujuan berikut:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Untuk menyediakan dan mengelola akun Anda.</li>
          <li>Untuk memproses pesanan Anda dan menyediakan layanan yang diminta.</li>
          <li>Untuk berkomunikasi dengan Anda mengenai pesanan Anda, pembaruan layanan, atau pertanyaan.</li>
          <li>Untuk mengirimkan notifikasi (misalnya, melalui WhatsApp) terkait pesanan atau status akun Anda.</li>
          <li>Untuk mempersonalisasi pengalaman pengguna Anda.</li>
          <li>Untuk keperluan administrasi internal, analisis data (dalam versi produksi), dan peningkatan layanan.</li>
        </ul>
        <p>Dalam versi PWA simulasi ini, penggunaan utama data adalah untuk memfungsikan fitur-fitur aplikasi secara lokal di perangkat Anda.</p>

        <h2 className="text-lg font-semibold metallic-gold-text pt-2">3. Penyimpanan dan Keamanan Data</h2>
        <p>Dalam versi PWA simulasi ini, data Anda (termasuk detail pesanan, profil, dll.) disimpan di `localStorage` browser Anda. Ini berarti data tersebut berada di perangkat Anda dan tidak dikirim ke server eksternal secara default oleh aplikasi ini.</p>
        <p>Kami mengambil langkah-langkah yang wajar untuk melindungi informasi Anda. Namun, perlu diingat bahwa tidak ada sistem keamanan yang sepenuhnya aman. Dalam aplikasi produksi dengan backend, kami akan menerapkan standar keamanan industri untuk melindungi data di server.</p>
        <p><strong>Penting:</strong> Karena data disimpan di `localStorage`, membersihkan cache browser atau data situs untuk {APP_NAME} akan menghapus data yang tersimpan secara lokal.</p>

        <h2 className="text-lg font-semibold metallic-gold-text pt-2">4. Pengungkapan Informasi Anda</h2>
        <p>Kami tidak menjual, memperdagangkan, atau menyewakan informasi identifikasi pribadi pengguna kepada pihak lain.</p>
        <p>Dalam versi PWA simulasi ini, tidak ada pengungkapan data ke pihak ketiga karena data bersifat lokal. Dalam aplikasi produksi, kami mungkin mengungkapkan informasi Anda dalam situasi berikut:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Dengan penyedia layanan pihak ketiga yang membantu kami mengoperasikan bisnis kami (misalnya, penyedia layanan pembayaran, platform notifikasi), dengan tunduk pada perjanjian kerahasiaan.</li>
          <li>Jika diwajibkan oleh hukum atau untuk menanggapi proses hukum yang sah.</li>
          <li>Untuk melindungi hak, properti, atau keselamatan kami, pelanggan kami, atau publik.</li>
        </ul>

        <h2 className="text-lg font-semibold metallic-gold-text pt-2">5. Hak Anda</h2>
        <p>Anda memiliki hak tertentu terkait informasi pribadi Anda, yang meliputi:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Hak untuk mengakses informasi pribadi Anda yang kami simpan.</li>
          <li>Hak untuk memperbaiki informasi yang tidak akurat atau tidak lengkap.</li>
          <li>Hak untuk meminta penghapusan informasi pribadi Anda (dalam batasan tertentu, dan dalam versi PWA ini dapat dilakukan dengan membersihkan data situs).</li>
        </ul>
        <p>Untuk menggunakan hak-hak ini, silakan hubungi kami melalui informasi kontak yang disediakan di bawah.</p>

        <h2 className="text-lg font-semibold metallic-gold-text pt-2">6. Cookie dan Teknologi Pelacakan</h2>
        <p>Aplikasi PWA ini mungkin menggunakan teknologi penyimpanan lokal (`localStorage`, `sessionStorage`) untuk fungsionalitas inti. Kami tidak secara aktif menggunakan cookie pelacakan pihak ketiga dalam versi simulasi ini. Aplikasi produksi mungkin menggunakan cookie untuk analisis dan personalisasi.</p>

        <h2 className="text-lg font-semibold metallic-gold-text pt-2">7. Perubahan pada Kebijakan Privasi Ini</h2>
        <p>Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Kami akan memberi tahu Anda tentang perubahan apa pun dengan memposting Kebijakan Privasi baru di halaman ini dan memperbarui tanggal "Terakhir Diperbarui". Anda disarankan untuk meninjau Kebijakan Privasi ini secara berkala untuk setiap perubahan.</p>

        <h2 className="text-lg font-semibold metallic-gold-text pt-2">8. Hubungi Kami</h2>
        <p>Jika Anda memiliki pertanyaan atau kekhawatiran tentang Kebijakan Privasi ini, silakan hubungi kami di:</p>
        <p>Email: <a href="mailto:admin@ewakoroyal.com" className="text-yellow-400 hover:underline">admin@ewakoroyal.com</a></p>
        <p>WhatsApp: <a href="https://wa.me/628110000000" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">+62 811 0000 000 (Admin Ewako Royal - Contoh)</a></p>

        <div className="mt-8 text-center">
            <Button onClick={() => navigate(-1)} variant="outline">
                Kembali
            </Button>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicyPage;
