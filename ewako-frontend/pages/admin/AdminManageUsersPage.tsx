
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { User } from '../../types';
import { getUsers } from '../../services/userService'; // Updated import
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ApiErrorResponse } from '../../services/api';

const getStatusColorClass = (status?: User['accountStatus']) => {
  switch (status) {
    case 'active':
      return 'bg-green-600 text-white';
    case 'pending_approval':
      return 'bg-yellow-500 text-black';
    case 'suspended':
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

const AdminManageUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError.message || 'Gagal memuat data pengguna.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (isLoading) {
    return <Layout><div className="flex justify-center items-center h-64"><LoadingSpinner /></div></Layout>;
  }

  if (error) {
    return <Layout><p className="text-red-400 bg-red-900 p-4 rounded-md text-center">{error}</p></Layout>;
  }

  return (
    <Layout>
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/admin')} className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors">
          <ArrowLeftIcon className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold metallic-gold-text">Kelola Pengguna</h1>
      </div>

      {users.length === 0 ? (
        <p className="text-gray-400">Tidak ada data pengguna.</p>
      ) : (
        <Card className="bg-gray-800 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">No. HP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status Akun</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">PPIU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{user.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{user.phone || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 capitalize">{user.role}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(user.accountStatus)}`}>
                      {user.accountStatus?.replace('_', ' ') || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{user.ppiuName || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <Link to={`/admin/users/${user.id}`}>
                      <Button variant="outline" size="sm" className="!p-1.5">
                        <PencilIcon className="h-4 w-4 mr-1" /> Detail
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </Layout>
  );
};

export default AdminManageUsersPage;
