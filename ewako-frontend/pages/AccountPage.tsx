
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { getUserById, updateUser } from '../services/userService'; // Updated import
import { DEFAULT_SUPPORT_PHONE, DEFAULT_SUPPORT_EMAIL } from '../constants';
import { useAuth } from '../App'; // Import useAuth
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth(); // Use auth context
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      if (auth.userId) {
        try {
          const fetchedUser = await getUserById(auth.userId);
          if (fetchedUser) {
            setUser(fetchedUser);
            setFormData({
              name: fetchedUser.name,
              email: fetchedUser.email,
              phone: fetchedUser.phone,
              ppiuName: fetchedUser.ppiuName,
              address: fetchedUser.address,
            });
          } else {
            // User ID from auth context but not found in DB (edge case)
            auth.logout(); // Log out if user data is inconsistent
            navigate('/login');
          }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            // Optionally redirect to login or show error
            auth.logout();
            navigate('/login');
        }
      } else {
        // Should be caught by ProtectedRoute, but as a safeguard:
        navigate('/login');
      }
      setIsLoading(false);
    };

    if (auth.isAuthenticated) { // Only fetch if authenticated
        fetchUserData();
    } else if (!auth.isLoading) { // If not loading and not authenticated, redirect
        navigate('/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userId, auth.isAuthenticated, auth.isLoading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { role, accountStatus, id, password, ...updateData } = formData as User & { password?: string };
      
      const updatedUser = await updateUser(user.id, updateData);
      if (updatedUser) {
        setUser(updatedUser);
        setFormData({
             name: updatedUser.name,
             email: updatedUser.email,
             phone: updatedUser.phone,
             ppiuName: updatedUser.ppiuName,
             address: updatedUser.address,
        });
        setIsEditing(false);
        alert("Profil berhasil diperbarui.");
      } else {
        alert("Gagal memperbarui profil.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    auth.logout(); // Use logout from auth context
    navigate('/');
    alert("Anda telah logout.");
  };

  if (isLoading || !user) {
    return <Layout><div className="flex justify-center items-center h-64"><LoadingSpinner /></div></Layout>;
  }
  
  const supportPhoneNumber = user.role === 'admin' && user.phone ? user.phone : DEFAULT_SUPPORT_PHONE;
  const supportEmailAddress = user.role === 'admin' && user.email ? user.email : DEFAULT_SUPPORT_EMAIL;
  const supportWhatsAppLink = `https://wa.me/${supportPhoneNumber.replace(/\D/g, '')}`;

  return (
    <Layout>
      <h1 className="text-3xl font-bold metallic-gold-text mb-8">Akun Saya</h1>
      <Card title="Profil Pengguna" className="bg-gray-800">
        {!isEditing ? (
          <div className="space-y-3 text-sm">
            <p><strong className="text-gray-400">Nama:</strong> {user.name}</p>
            <p><strong className="text-gray-400">Email:</strong> {user.email}</p>
            <p><strong className="text-gray-400">No. HP:</strong> {user.phone || '-'}</p>
            <p><strong className="text-gray-400">Alamat:</strong> {user.address || '-'}</p>
            {user.role === 'customer' && <p><strong className="text-gray-400">PPIU/PIHK:</strong> {user.ppiuName || '-'}</p>}
            <p><strong className="text-gray-400">Role:</strong> <span className="capitalize">{user.role}</span></p>
            <p><strong>Status Akun:</strong> <span className={`font-semibold ${
                    user.accountStatus === 'active' ? 'text-green-400' :
                    user.accountStatus === 'pending_approval' ? 'text-yellow-400' :
                    user.accountStatus === 'suspended' ? 'text-red-400' : 'text-gray-400'
                }`}>
                    {user.accountStatus?.replace('_', ' ') || 'Belum Diatur'}
            </span></p>
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="mt-4">
              Ubah Profil
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-4">
            <Input label="Nama" name="name" value={formData.name || ''} onChange={handleInputChange} />
            <Input label="Email" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
            <Input label="No. HP" name="phone" type="tel" value={formData.phone || ''} onChange={handleInputChange} />
            <Input label="Alamat" name="address" value={formData.address || ''} onChange={handleInputChange} />
            {user.role === 'customer' && <Input label="PPIU/PIHK" name="ppiuName" value={formData.ppiuName || ''} onChange={handleInputChange} />}
            <div className="flex space-x-3 mt-4">
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                Simpan Perubahan
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" disabled={isSaving}>
                Batal
              </Button>
            </div>
          </form>
        )}
      </Card>

      {user.role === 'admin' && (
        <Card title="Pengaturan Admin" className="mt-6 bg-gray-800">
           <Button onClick={() => navigate('/admin/settings')} variant="secondary" className="w-full">
            Buka Pengaturan Admin
          </Button>
        </Card>
      )}

      <Card title="Bantuan" className="mt-8 bg-gray-800">
        <p className="text-gray-300">Butuh bantuan? Hubungi kami melalui:</p>
        <ul className="list-disc list-inside text-gray-400 mt-2 text-sm">
            <li>WhatsApp: <a href={supportWhatsAppLink} target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">{supportPhoneNumber}</a></li>
            <li>Email: <a href={`mailto:${supportEmailAddress}`} className="text-yellow-400 hover:underline">{supportEmailAddress}</a></li>
        </ul>
      </Card>

       <div className="mt-8 text-center">
        <Button onClick={handleLogout} variant="danger" size="md">
          Logout
        </Button>
      </div>
    </Layout>
  );
};

export default AccountPage;
