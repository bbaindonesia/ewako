
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Vehicle } from '../../types';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../../services/vehicleService'; // Updated
import { ArrowLeftIcon, PlusCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ApiErrorResponse } from '../../services/api';

const vehicleTypeOptions = [
  { value: '', label: 'Pilih Tipe' },
  { value: 'Bus', label: 'Bus' },
  { value: 'HiAce', label: 'HiAce' },
  { value: 'SUV', label: 'SUV' },
];

const initialVehicleForm: Omit<Vehicle, 'id'> = {
  type: '',
  name: '',
  plateNumber: '',
  driverName: '',
  driverPhone: '',
  companyName: '',
};

const AdminManageVehiclesPage: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<Omit<Vehicle, 'id'>>(initialVehicleForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedVehicles = await getVehicles();
      setVehicles(fetchedVehicles);
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError.message || 'Gagal memuat data kendaraan.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleOpenForm = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      const { id, ...formData } = vehicle;
      setVehicleForm(formData);
    } else {
      setEditingVehicle(null);
      setVehicleForm(initialVehicleForm);
    }
    setShowFormModal(true);
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
    setEditingVehicle(null);
    setVehicleForm(initialVehicleForm);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setVehicleForm({ ...vehicleForm, [e.target.name]: e.target.value });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.type || !vehicleForm.name || !vehicleForm.plateNumber) {
      alert("Tipe, Nama Kendaraan, dan Nomor Plat wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vehicleForm);
      } else {
        await createVehicle(vehicleForm);
      }
      await fetchVehicles(); 
      handleCloseForm();
    } catch (err) {
      const apiError = err as ApiErrorResponse;
      setError(apiError.message || `Gagal ${editingVehicle ? 'memperbarui' : 'menambah'} kendaraan.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kendaraan ini?")) {
      setIsLoading(true); 
      setError(null);
      try {
        await deleteVehicle(vehicleId);
        await fetchVehicles();
      } catch (err) {
        const apiError = err as ApiErrorResponse;
        setError(apiError.message || "Gagal menghapus kendaraan.");
      } finally {
        setIsLoading(false);
      }
    }
  };


  if (isLoading && vehicles.length === 0) {
    return <Layout><div className="flex justify-center items-center h-64"><LoadingSpinner /></div></Layout>;
  }


  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
            <button onClick={() => navigate('/admin')} className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors">
            <ArrowLeftIcon className="h-6 w-6 text-white" />
            </button>
            <h1 className="text-2xl font-bold metallic-gold-text">Atur Kendaraan</h1>
        </div>
        <Button onClick={() => handleOpenForm()} variant="primary" size="sm">
          <PlusCircleIcon className="h-5 w-5 mr-2" /> Tambah Kendaraan
        </Button>
      </div>

      {error && <p className="text-red-400 bg-red-900 p-3 rounded-md mb-4">{error}</p>}
      
      {isLoading && vehicles.length > 0 && <div className="my-4"><LoadingSpinner size="sm" /></div>}


      {vehicles.length === 0 && !isLoading && !error && (
        <p className="text-gray-400">Belum ada data kendaraan. Silakan tambahkan.</p>
      )}

      {vehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} title={`${vehicle.name} (${vehicle.type})`} className="bg-gray-800">
              <div className="space-y-1 text-sm">
                <p><strong>No. Plat:</strong> {vehicle.plateNumber}</p>
                <p><strong>Driver:</strong> {vehicle.driverName || '-'} ({vehicle.driverPhone || '-'})</p>
                <p><strong>Perusahaan:</strong> {vehicle.companyName || '-'}</p>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenForm(vehicle)} className="!p-1.5">
                  <PencilIcon className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteVehicle(vehicle.id)} className="!p-1.5">
                  <TrashIcon className="h-4 w-4 mr-1" /> Hapus
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <Card title={editingVehicle ? "Edit Kendaraan" : "Tambah Kendaraan Baru"} className="bg-gray-800 w-full max-w-lg">
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <Select
                label="Tipe Kendaraan*"
                name="type"
                value={vehicleForm.type}
                onChange={handleFormChange}
                options={vehicleTypeOptions}
                required
              />
              <Input
                label="Nama Kendaraan*"
                name="name"
                value={vehicleForm.name}
                onChange={handleFormChange}
                placeholder="Mis: Bus Mercedes Benz OH 1626 #1"
                required
              />
              <Input
                label="Nomor Plat Kendaraan*"
                name="plateNumber"
                value={vehicleForm.plateNumber}
                onChange={handleFormChange}
                placeholder="Mis: B 1234 XYZ"
                required
              />
              <Input
                label="Nama Driver (Opsional)"
                name="driverName"
                value={vehicleForm.driverName || ''}
                onChange={handleFormChange}
              />
              <Input
                label="No. HP Driver (Opsional)"
                name="driverPhone"
                type="tel"
                value={vehicleForm.driverPhone || ''}
                onChange={handleFormChange}
                placeholder="+62812..."
              />
              <Input
                label="Nama Perusahaan/Syarikah (Opsional)"
                name="companyName"
                value={vehicleForm.companyName || ''}
                onChange={handleFormChange}
              />
              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={handleCloseForm} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  {editingVehicle ? "Simpan Perubahan" : "Tambah Kendaraan"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </Layout>
  );
};

export default AdminManageVehiclesPage;
