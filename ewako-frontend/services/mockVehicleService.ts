
import { Vehicle } from '../types';

const VEHICLES_STORAGE_KEY = 'ewakoRoyalVehicles';

const getStoredVehicles = (): Vehicle[] => {
  const stored = localStorage.getItem(VEHICLES_STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsedData = JSON.parse(stored);
    if (!Array.isArray(parsedData)) {
      console.warn(`Data in localStorage for ${VEHICLES_STORAGE_KEY} is not an array. Clearing and returning empty.`);
      localStorage.removeItem(VEHICLES_STORAGE_KEY);
      return [];
    }
    return parsedData as Vehicle[];
  } catch (error) {
    console.error(`Error parsing vehicles from localStorage (key: ${VEHICLES_STORAGE_KEY}). Clearing and returning empty.`, error);
    try {
      localStorage.removeItem(VEHICLES_STORAGE_KEY);
    } catch (removeError) {
      console.error(`Failed to remove corrupted item ${VEHICLES_STORAGE_KEY} from localStorage:`, removeError);
    }
    return [];
  }
};

const saveStoredVehicles = (vehicles: Vehicle[]) => {
  localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));
};

// Initialize with some mock vehicles if empty
if (getStoredVehicles().length === 0) {
  const initialMockVehicles: Vehicle[] = [
    { id: 'v_bus1', type: 'Bus', name: 'Hino R260 #1', plateNumber: 'B 1234 XYZ', driverName: 'Pak Budi', driverPhone: '+6281211112222', companyName: 'Ewako Trans' },
    { id: 'v_bus2', type: 'Bus', name: 'Mercedes Benz OH 1626 #2', plateNumber: 'B 5678 ABC', driverName: 'Pak Agus', driverPhone: '+6281233334444', companyName: 'Ewako Trans' },
    { id: 'v_hiace1', type: 'HiAce', name: 'Toyota HiAce Premio #1', plateNumber: 'D 9101 JKL', driverName: 'Kang Ujang', driverPhone: '+6281255556666', companyName: 'Mitra Wisata' },
    { id: 'v_suv1', type: 'SUV', name: 'Toyota Alphard', plateNumber: 'F 1122 MNO', driverName: 'Mas Anto', driverPhone: '+6281277778888', companyName: 'VIP Service' },
  ];
  saveStoredVehicles(initialMockVehicles);
}

export const getVehicles = async (): Promise<Vehicle[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getStoredVehicles().sort((a,b) => a.name.localeCompare(b.name)));
    }, 200);
  });
};

export const getVehicleById = async (id: string): Promise<Vehicle | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const vehicles = getStoredVehicles();
      resolve(vehicles.find(v => v.id === id));
    }, 200);
  });
};

export const createVehicle = async (vehicleData: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const vehicles = getStoredVehicles();
      const newVehicle: Vehicle = {
        ...vehicleData,
        id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      };
      vehicles.push(newVehicle);
      saveStoredVehicles(vehicles);
      resolve(newVehicle);
    }, 300);
  });
};

export const updateVehicle = async (id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let vehicles = getStoredVehicles();
      const vehicleIndex = vehicles.findIndex(v => v.id === id);
      if (vehicleIndex !== -1) {
        vehicles[vehicleIndex] = { ...vehicles[vehicleIndex], ...updates };
        saveStoredVehicles(vehicles);
        resolve(vehicles[vehicleIndex]);
      } else {
        resolve(undefined);
      }
    }, 300);
  });
};

export const deleteVehicle = async (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let vehicles = getStoredVehicles();
      const initialLength = vehicles.length;
      vehicles = vehicles.filter(v => v.id !== id);
      if (vehicles.length < initialLength) {
        saveStoredVehicles(vehicles);
        resolve(true);
      } else {
        resolve(false);
      }
    }, 300);
  });
};
