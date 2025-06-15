
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { APP_NAME } from '../constants';
import { UserIcon, EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, MapPinIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { User } from '../types';
import { registerUser } from '../services/userService'; // Updated import
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../App';
import { ApiErrorResponse } from '../services/api'; // For typed error

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [formData, setFormData] = useState<Omit<User, 'id' | 'role' | 'accountStatus' | 'password'> & { password?: string }>({
    name: '',
    email: '',
    phone: '',
    ppiuName: '',
    address: '',
    password: '', 
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePhoneNumber = (phone: string | undefined): boolean => {
    if (!phone) return false;
    const phoneRegex = /^(08\d{7,13}|^\+62\d{7,13})$/;
    return phoneRegex.test(phone);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Semua field dengan tanda (*) wajib diisi.');
      return;
    }
    if (!validatePhoneNumber(formData.phone)) {
        setError('Format Nomor HP tidak valid. Contoh: 08123456789 atau +628123456789');
        return;
    }
    if (formData.password !== confirmPassword) {
      setError('Sandi dan Konfirmasi Sandi tidak cocok.');
      return;
    }
    if (formData.password.length < 6) {
        setError('Sandi minimal harus 6 karakter.');
        return;
    }

    setIsLoading(true);
    try {
      await registerUser(formData);
      setSuccess('Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Admin. Anda akan dialihkan ke halaman login.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      console.error("Registration failed:", apiError);
      if (apiError.errors) {
        // Handle validation errors from backend
        const messages = Object.values(apiError.errors).flat().join(' ');
        setError(messages || 'Gagal melakukan pendaftaran.');
      } else {
        setError(apiError.message || 'Gagal melakukan pendaftaran. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#1A1A1A]">
      <div className="flex flex-grow items-center justify-center p-4 py-8">
        <div className="max-w-lg w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold metallic-gold-text" style={{ fontFamily: "'Poppins', sans-serif" }}>{APP_NAME}</h1>
            <p className="text-gray-400 mt-1">Buat Akun Baru</p>
          </div>
          <Card className="bg-gray-800 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4 p-2">
              <Input
                id="name"
                name="name"
                label="Nama Lengkap*"
                value={formData.name}
                onChange={handleInputChange}
                required
                icon={<UserIcon className="h-5 w-5 text-gray-400" />}
              />
              <Input
                id="phone"
                name="phone"
                label="No. HP Aktif (WhatsApp)*"
                type="tel"
                value={formData.phone || ''}
                onChange={handleInputChange}
                required
                icon={<PhoneIcon className="h-5 w-5 text-gray-400" />}
                placeholder="08xxxxxxxxxx atau +62xxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 -mt-2 ml-1">Untuk notifikasi. (Format: 08... atau +62...)</p>
              <Input
                id="email"
                name="email"
                label="Email Aktif*"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />}
              />
              <p className="text-xs text-gray-500 -mt-2 ml-1">Untuk verifikasi dan recovery akun.</p>
              <Input
                id="ppiuName"
                name="ppiuName"
                label="Nama PPIU/PIHK (Opsional)"
                value={formData.ppiuName || ''}
                onChange={handleInputChange}
                icon={<BuildingOfficeIcon className="h-5 w-5 text-gray-400" />}
              />
              <Input
                id="address"
                name="address"
                label="Alamat (Opsional)"
                value={formData.address || ''}
                onChange={handleInputChange}
                icon={<MapPinIcon className="h-5 w-5 text-gray-400" />}
              />
              <Input
                id="password"
                name="password"
                label="Sandi*"
                type="password"
                value={formData.password || ''}
                onChange={handleInputChange}
                required
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
              />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                label="Konfirmasi Sandi*"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
              />

              {error && <p className="text-xs text-red-400 text-center bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>}
              {success && <p className="text-xs text-green-400 text-center bg-green-900 bg-opacity-30 p-2 rounded">{success}</p>}
              
              <Button type="submit" variant="primary" isLoading={isLoading} fullWidth size="lg">
                Daftar
              </Button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                Sudah punya akun? <Link to="/login" className="font-medium text-yellow-500 hover:text-yellow-400">Login di sini</Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
      <BottomNav userRole={userRole} />
    </div>
  );
};

export default RegisterPage;
