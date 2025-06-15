
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select'; 
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { User, Order, OrderStatus } from '../../types';
import { getUserById, updateUser, updateUserAccountStatus } from '../../services/userService'; // Updated
import { getOrdersByUserId } from '../../services/orderService'; // Updated
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
// import { sendNotificationToCustomer } from '../../services/whatsappService'; // Notification handled in service
import { ApiErrorResponse } from '../../services/api';


const accountStatusOptions: { value: User['accountStatus'], label: string }[] = [
    { value: 'pending_approval', label: 'Menunggu Persetujuan' },
    { value: 'active', label: 'Aktif' },
    { value: 'suspended', label: 'Ditangguhkan' },
];

const AdminUserDetailsPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [selectedAccountStatus, setSelectedAccountStatus] = useState<User['accountStatus'] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);


  const fetchUserDetails = useCallback(async () => {
    if (!userId) {
      setError("User ID tidak valid.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUser = await getUserById(userId);
      if (fetchedUser) {
        setUser(fetchedUser);
        setFormData({ name: fetchedUser.name, email: fetchedUser.email, phone: fetchedUser.phone, ppiuName: fetchedUser.ppiuName, address: fetchedUser.address });
        setSelectedAccountStatus(fetchedUser.accountStatus);
        const fetchedOrders = await getOrdersByUserId(userId);
        setOrders(fetchedOrders);
      } else {
        setError("Pengguna tidak ditemukan.");
      }
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError.message || "Gagal memuat detail pengguna.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async () => {
    if (!userId || !user) return;
    setIsSavingProfile(true);
    setError(null);
    try {
      const { id, role, accountStatus, password, ...updateData } = formData;
      const updatedUser = await updateUser(userId, updateData as Partial<Omit<User, 'id' | 'role' | 'accountStatus'>>); // Cast to ensure correct type
      if (updatedUser) {
        setUser(updatedUser);
        setIsEditing(false);
        alert("Profil pengguna berhasil diperbarui.");
      } else {
        throw new Error("Gagal update user dari API");
      }
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError.message || "Gagal menyimpan perubahan profil.");
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAccountStatusChange = async () => {
    if (!userId || !selectedAccountStatus || selectedAccountStatus === user?.accountStatus) {
      setStatusUpdateMessage({type: 'error', text: 'Pilih status yang berbeda atau status tidak valid.'});
      return;
    }
    setIsSubmittingStatus(true);
    setStatusUpdateMessage(null);
    try {
      const updatedUser = await updateUserAccountStatus(userId, selectedAccountStatus);
      if (updatedUser) {
        setUser(updatedUser); 
        setSelectedAccountStatus(updatedUser.accountStatus); // Ensure dropdown reflects the new state
        setStatusUpdateMessage({type: 'success', text: `Status akun berhasil diubah menjadi ${selectedAccountStatus.replace('_', ' ')}.`});
      } else {
        throw new Error("Gagal update status akun dari API");
      }
    } catch (err: any) {
      const apiError = err as ApiErrorResponse;
      setStatusUpdateMessage({type: 'error', text: apiError.message || 'Gagal mengubah status akun.'});
      console.error(err);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const calculateTotalPayments = (): number => {
    return orders.reduce((total, order) => {
      const orderPayments = order.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      return total + orderPayments;
    }, 0);
  };

  if (isLoading && !user) return <Layout><div className="flex justify-center items-center h-64"><LoadingSpinner /></div></Layout>;
  if (error && !user) return <Layout><p className="text-red-400 bg-red-900 p-4 rounded-md text-center">{error}</p></Layout>;
  if (!user) return <Layout><p className="text-gray-400 text-center">Pengguna tidak ditemukan.</p></Layout>;

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/admin/users')} className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors">
          <ArrowLeftIcon className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold metallic-gold-text">Detail Pengguna: {user.name}</h1>
      </div>

      {statusUpdateMessage && (
        <div className={`p-3 mb-4 rounded-md text-sm ${statusUpdateMessage.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {statusUpdateMessage.text}
        </div>
      )}
      {error && !statusUpdateMessage && <p className="text-red-400 bg-red-900 p-3 rounded-md mb-4">{error}</p>}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
            <Card title="Profil Pengguna" className="bg-gray-800">
            {!isEditing ? (
                <div className="space-y-2 text-sm">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Nama:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>No. HP:</strong> {user.phone || '-'}</p>
                <p><strong>Alamat:</strong> {user.address || '-'}</p>
                <p><strong>Role:</strong> <span className="capitalize">{user.role}</span></p>
                {user.role === 'customer' && <p><strong>PPIU/PIHK:</strong> {user.ppiuName || '-'}</p>}
                <p><strong>Status Akun:</strong> <span className={`font-semibold ${
                    user.accountStatus === 'active' ? 'text-green-400' :
                    user.accountStatus === 'pending_approval' ? 'text-yellow-400' :
                    user.accountStatus === 'suspended' ? 'text-red-400' : 'text-gray-400'
                }`}>
                    {user.accountStatus?.replace('_', ' ') || 'Belum Diatur'}
                </span></p>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="mt-3">Edit Profil</Button>
                </div>
            ) : (
                <div className="space-y-3">
                <Input label="Nama" name="name" value={formData.name || ''} onChange={handleInputChange} />
                <Input label="Email" name="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
                <Input label="No. HP" name="phone" type="tel" value={formData.phone || ''} onChange={handleInputChange} />
                <Input label="Alamat" name="address" value={formData.address || ''} onChange={handleInputChange} />
                {user.role === 'customer' && <Input label="PPIU/PIHK" name="ppiuName" value={formData.ppiuName || ''} onChange={handleInputChange} />}
                <div className="flex space-x-2 mt-3">
                    <Button onClick={handleSaveChanges} isLoading={isSavingProfile}>Simpan</Button>
                    <Button onClick={() => { setIsEditing(false); setFormData({ name: user.name, email: user.email, phone: user.phone, ppiuName: user.ppiuName, address: user.address }); }} variant="outline">Batal</Button>
                </div>
                </div>
            )}
            </Card>

            <Card title="Ubah Status Akun" className="bg-gray-800">
                <Select
                    label="Status Akun Saat Ini:"
                    options={accountStatusOptions}
                    value={selectedAccountStatus || ''}
                    onChange={(e) => setSelectedAccountStatus(e.target.value as User['accountStatus'])}
                />
                <Button onClick={handleAccountStatusChange} isLoading={isSubmittingStatus} variant="primary" className="mt-3 w-full">
                    Update Status Akun
                </Button>
            </Card>

            <Card title="Ringkasan Keuangan" className="bg-gray-800">
                <p><strong>Total Pesanan:</strong> {orders.length}</p>
                <p><strong>Total Pembayaran Diterima:</strong> IDR {calculateTotalPayments().toLocaleString('id-ID')}</p>
            </Card>
        </div>

        <div className="md:col-span-2">
          <Card title={`Pesanan oleh ${user.name}`} className="bg-gray-800">
            {orders.length === 0 ? (
              <p className="text-gray-400">Pengguna ini belum memiliki pesanan.</p>
            ) : (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {orders.map(order => (
                  <li key={order.id} className="p-3 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                    <Link to={`/admin/orders/${order.id}`} className="block">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{order.serviceType} - ID: {order.id.substring(0,8)}...</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === OrderStatus.FULLY_PAID ? 'bg-green-600' : 'bg-yellow-600 text-black'}`}>{order.status}</span>
                      </div>
                      <p className="text-sm text-gray-300">Tanggal: {new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                      {order.totalPrice && <p className="text-sm text-gray-300">Total Harga: IDR {order.totalPrice.toLocaleString('id-ID')}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminUserDetailsPage;
