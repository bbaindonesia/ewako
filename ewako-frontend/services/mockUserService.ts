
import { User } from '../types';
import { sendNotificationToCustomer } from './whatsappService'; // For notifications

const USERS_STORAGE_KEY = 'ewakoRoyalUsers';

const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsedData = JSON.parse(stored);
    // Ensure it's an array, as localStorage could store anything that stringifies.
    if (!Array.isArray(parsedData)) {
        console.warn(`Data in localStorage for ${USERS_STORAGE_KEY} is not an array. Clearing and returning empty.`);
        localStorage.removeItem(USERS_STORAGE_KEY);
        return [];
    }
    return parsedData as User[];
  } catch (error) {
    console.error(`Error parsing users from localStorage (key: ${USERS_STORAGE_KEY}). Clearing and returning empty.`, error);
    // Attempt to clear the corrupted item
    try {
      localStorage.removeItem(USERS_STORAGE_KEY);
    } catch (removeError) {
      console.error(`Failed to remove corrupted item ${USERS_STORAGE_KEY} from localStorage:`, removeError);
    }
    return [];
  }
};

const saveStoredUsers = (users: User[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

// Initialize with some mock users if empty
if (getStoredUsers().length === 0) {
  const initialMockUsers: User[] = [
    { id: 'customer1', name: 'Ahmad Subarjo', email: 'ahmad.subarjo@example.com', phone: '+6281234567890', role: 'customer', ppiuName: 'Barokah Travel Jaya', address: 'Jl. Merdeka No. 1, Jakarta', accountStatus: 'active', password: 'password123' },
    { id: 'customer2', name: 'Siti Aminah', email: 'siti.aminah@example.com', phone: '+6281234567891', role: 'customer', ppiuName: 'Anugerah Umroh', address: 'Jl. Mawar No. 2, Bandung', accountStatus: 'active', password: 'password123' },
    { id: 'adminUser', name: 'Admin Ewako', email: 'admin@ewakoroyal.com', phone: '+628110000000', role: 'admin', address: 'Kantor Pusat Ewako Royal', accountStatus: 'active', password: 'admin123' },
  ];
  saveStoredUsers(initialMockUsers);
}

export const loginUser = async (credentials: { email?: string, phone?: string, password?: string }): Promise<{ token: string, user: User }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getStoredUsers(); // Now guaranteed to be an array
      const { email, phone, password } = credentials;

      const user = users.find(u => 
        (email && u.email === email) || (phone && u.phone === phone)
      );

      if (user && user.password === password) {
        if (user.accountStatus === 'active') {
          resolve({
            token: `mock-jwt-token-for-${user.id}-${Date.now()}`,
            user: user
          });
        } else if (user.accountStatus === 'pending_approval') {
          reject({ message: "Akun Anda sedang menunggu persetujuan Admin." });
        } else if (user.accountStatus === 'suspended') {
          reject({ message: "Akun Anda telah ditangguhkan. Silakan hubungi Admin." });
        } else {
           reject({ message: "Status akun tidak valid. Hubungi Admin." });
        }
      } else {
        // More specific error for existing but wrong password users
        if (user && user.password !== password) {
            reject({ message: "Email/No. HP atau sandi salah." });
        } else { // User not found or other generic cases
            reject({ message: "Email/No. HP atau sandi salah, atau akun tidak aktif." });
        }
      }
    }, 500); // Simulate network delay
  });
};

export const getUsers = async (): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getStoredUsers());
    }, 200);
  });
};

export const getUserById = async (userId: string): Promise<User | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const users = getStoredUsers();
      resolve(users.find(user => user.id === userId));
    }, 200);
  });
};

export const updateUser = async (userId: string, updates: Partial<Omit<User, 'id' | 'role' | 'accountStatus'>>): Promise<User | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let users = getStoredUsers();
      const userIndex = users.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        // Prevent role and accountStatus change through this general update function
        const { role, id, accountStatus, ...allowedUpdates } = updates as any; 
        users[userIndex] = { ...users[userIndex], ...allowedUpdates };
        saveStoredUsers(users);
        resolve(users[userIndex]);
      } else {
        resolve(undefined);
      }
    }, 300);
  });
};

export const registerUser = async (userData: Omit<User, 'id' | 'role' | 'accountStatus'> & { password?: string }): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getStoredUsers();
      if (users.find(user => user.email === userData.email)) {
        reject({ message: "Email sudah terdaftar." }); // Return ApiErrorResponse like object
        return;
      }
       if (userData.phone && users.find(user => user.phone === userData.phone)) {
        reject({ message: "Nomor telepon sudah terdaftar." });
        return;
      }
      
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        ppiuName: userData.ppiuName,
        address: userData.address,
        password: userData.password, // Store password for mock login
        role: 'customer', 
        accountStatus: 'pending_approval', // New users need admin approval
      };
      
      users.push(newUser);
      saveStoredUsers(users);
      resolve(newUser);
    }, 500);
  });
};

export const updateUserAccountStatus = async (userId: string, newStatus: User['accountStatus']): Promise<User | undefined> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let users = getStoredUsers();
      const userIndex = users.findIndex(user => user.id === userId);
      if (userIndex !== -1) {
        users[userIndex].accountStatus = newStatus;
        saveStoredUsers(users);
        
        // Notify user about status change (optional)
        const user = users[userIndex];
        if (user.phone) {
          let message = '';
          if (newStatus === 'active') {
            message = `Akun Ewako Royal Anda telah diaktifkan oleh Admin. Anda sekarang dapat login.`;
          } else if (newStatus === 'suspended') {
            message = `Akun Ewako Royal Anda telah ditangguhkan oleh Admin. Silakan hubungi Admin untuk informasi lebih lanjut.`;
          } else if (newStatus === 'pending_approval') {
            message = `Status akun Ewako Royal Anda diubah menjadi 'Menunggu Persetujuan'.`;
          }
          if (message) {
            sendNotificationToCustomer(user.phone, message);
          }
        }
        resolve(users[userIndex]);
      } else {
        reject({ message: "Pengguna tidak ditemukan." }); // Return ApiErrorResponse like object
      }
    }, 300);
  });
};
