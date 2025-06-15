import { Vehicle } from '../types';
import fetchApi from './api';

export const getVehicles = async (): Promise<Vehicle[]> => {
  return fetchApi<Vehicle[]>('/vehicles');
};

export const getVehicleById = async (id: string): Promise<Vehicle | undefined> => {
  return fetchApi<Vehicle | undefined>(`/vehicles/${id}`);
};

export const createVehicle = async (vehicleData: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  return fetchApi<Vehicle>('/vehicles', {
    method: 'POST',
    body: vehicleData,
  });
};

export const updateVehicle = async (id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined> => {
  return fetchApi<Vehicle | undefined>(`/vehicles/${id}`, {
    method: 'PUT',
    body: updates,
  });
};

export const deleteVehicle = async (id: string): Promise<boolean> => {
  // fetchApi for DELETE might return null or an empty response on success (204)
  // We'll assume success if no error is thrown.
  try {
    await fetchApi<null>(`/vehicles/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error('Failed to delete vehicle:', error);
    return false;
  }
};
