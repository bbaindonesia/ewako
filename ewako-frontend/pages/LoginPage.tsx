
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { APP_NAME } from '../constants';
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../App';
import { loginUser } from '../services/userService'; // Updated import to use real service
import { ApiErrorResponse } from '../services/api'; // For typed error

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth(); // Get the full auth context
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Determine if login is via email or phone
      const loginPayload: { email?: string, phone?: string, password?: string } = { password };
      if (emailOrPhone.includes('@')) {
        loginPayload.email = emailOrPhone;
      } else {
        loginPayload.phone = emailOrPhone;
      }
      
      const { token, user } = await loginUser(loginPayload);

      if (token && user) {
        if (user.accountStatus === 'active') {
          auth.login(token, user); // Use auth context to set state
          if (user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else if (user.accountStatus === 'pending_approval') {
          setError('Akun Anda sedang menunggu persetujuan Admin.');
        } else if (user.accountStatus === 'suspended') {
          setError('Akun Anda telah ditangguhkan. Silakan hubungi Admin.');
        } else {
          setError('Status akun tidak valid. Hubungi Admin.');
        }
      } else {
        setError('Login gagal. Data tidak lengkap dari server.');
      }
    } catch (err) {
      const apiError = err as ApiErrorResponse; // Cast to specific error type
      console.error("Login failed:", apiError);
      setError(apiError.message || 'Email/No. HP atau sandi salah, atau akun tidak aktif.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#1A1A1A]">
      <div className="flex flex-grow items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold metallic-gold-text" style={{ fontFamily: "'Poppins', sans-serif" }}>{APP_NAME}</h1>
            <p className="text-gray-400 mt-2">Silakan login untuk melanjutkan</p>
          </div>
          <Card className="bg-gray-800 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6 p-2">
              <Input
                id="emailOrPhone" // Changed id and name
                name="emailOrPhone"
                label="Email atau No. Handphone"
                type="text" 
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />} // Kept envelope, or use a generic user icon
                placeholder="user@ewako.com / 0812..."
              />
              <Input
                id="password"
                name="password"
                label="Sandi"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                placeholder="password"
              />
              {error && <p className="text-xs text-red-400 text-center">{error}</p>}
              <Button type="submit" variant="primary" isLoading={isLoading} fullWidth size="lg">
                Login
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Belum punya akun? <Link to="/register" className="font-medium text-yellow-500 hover:text-yellow-400">Daftar di sini</Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
      <BottomNav userRole={auth.userRole} />
    </div>
  );
};

export default LoginPage;
