
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from '@/pages/LoginPage'; 
import RegisterPage from './pages/RegisterPage'; 
import BookServicePage from './pages/BookServicePage';
import HotelBookingPage from './pages/HotelBookingPage';
import VisaBookingPage from './pages/VisaBookingPage';
import HandlingBookingPage from './pages/HandlingBookingPage';
import JastipPage from './pages/JastipPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailsPage from '@/pages/OrderDetailsPage'; 
import AccountPage from './pages/AccountPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminManageOrdersPage from './pages/admin/AdminManageOrdersPage';
import AdminOrderDetailsPage from './pages/admin/AdminOrderDetailsPage.tsx';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Layout } from './components/Layout'; 
import FlightBookingPage from './pages/FlightBookingPage'; 
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

import AdminManageUsersPage from './pages/admin/AdminManageUsersPage';
import AdminUserDetailsPage from './pages/admin/AdminUserDetailsPage';
import AdminManageVehiclesPage from './pages/admin/AdminManageVehiclesPage';
import AdminChatPage from './pages/admin/AdminChatPage';
import { User } from './types'; // Assuming User type is defined for role

console.log("%c EWAKO ROYAL APP.TSX IS RUNNING - DB INTEGRATION VERSION ", "background: darkblue; color: white; font-size: 16px; font-weight: bold;");

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: User['role'] | null;
  userId: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateAuthContextOnLoad: () => void; // Function to re-sync from localStorage
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('ewakoRoyalToken'));
  const [userRole, setUserRole] = useState<User['role'] | null>(localStorage.getItem('ewakoRoyalUserRole') as User['role'] | null);
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('ewakoRoyalUserId'));
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  const login = (token: string, user: User) => {
    localStorage.setItem('ewakoRoyalToken', token);
    localStorage.setItem('ewakoRoyalUserId', user.id);
    localStorage.setItem('ewakoRoyalUserRole', user.role);
    setIsAuthenticated(true);
    setUserId(user.id);
    setUserRole(user.role);
  };

  const logout = () => {
    localStorage.removeItem('ewakoRoyalToken');
    localStorage.removeItem('ewakoRoyalUserId');
    localStorage.removeItem('ewakoRoyalUserRole');
    setIsAuthenticated(false);
    setUserId(null);
    setUserRole(null);
  };
  
  const updateAuthContextOnLoad = () => {
    setIsLoading(true);
    const token = localStorage.getItem('ewakoRoyalToken');
    const storedUserId = localStorage.getItem('ewakoRoyalUserId');
    const storedUserRole = localStorage.getItem('ewakoRoyalUserRole') as User['role'] | null;

    if (token && storedUserId && storedUserRole) {
      // Potentially add token validation here with a quick API call if needed
      setIsAuthenticated(true);
      setUserId(storedUserId);
      setUserRole(storedUserRole);
    } else {
      // If any part is missing, ensure logout state
      logout();
    }
    setIsLoading(false);
  };

  useEffect(() => {
    updateAuthContextOnLoad(); // Initial load check
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'ewakoRoyalToken' || event.key === 'ewakoRoyalUserId' || event.key === 'ewakoRoyalUserRole') {
        console.log(`%c[Auth Sync] Storage changed. Re-syncing auth state.`, "color: purple;");
        updateAuthContextOnLoad();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, userId, isLoading, login, logout, updateAuthContextOnLoad }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ProtectedRoute: React.FC<{ allowedRoles?: Array<User['role']> }> = ({ allowedRoles }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  if (isLoading) { 
    return ( <div className="flex justify-center items-center h-screen bg-[#1A1A1A]"> <LoadingSpinner size="lg" /> </div> );
  }
  if (!isAuthenticated) { 
    console.log("%c[ProtectedRoute] User not authenticated. Redirecting to /login.", "color: red;");
    return <Navigate to="/login" replace />; 
  }
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    console.log(`%c[ProtectedRoute] User role '${userRole}' not allowed. Redirecting.`, "color: orange;");
    return <Navigate to={userRole === 'admin' ? '/admin' : '/'} replace />;
  }
  return <Outlet />;
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

// Separate component for routes to ensure useAuth is called within AuthProvider context
const AppRoutes: React.FC = () => {
  const { updateAuthContextOnLoad } = useAuth();
  useEffect(() => {
     // This ensures that on direct navigation or refresh, auth state is checked
    updateAuthContextOnLoad(); 
    console.log(
      `%c[AppRoutes Init - DB Version] Diagnostic Log:
      --------------------------------------
      Window HREF: ${window.location.href}
      Window Hash: ${window.location.hash}
      --------------------------------------`,
      "color: blue; font-weight: bold; font-size: 14px; border: 1px solid blue; padding: 5px;"
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/book" element={<BookServicePage />} />
          <Route path="/book/hotel" element={<HotelBookingPage />} />
          <Route path="/book/visa" element={<VisaBookingPage />} />
          <Route path="/book/handling" element={<HandlingBookingPage />} />
          <Route path="/book/train" element={<div><Layout><h1>Tiket Kereta (Segera Hadir)</h1></Layout></div>} />
          <Route path="/book/flight" element={<FlightBookingPage />} /> 
          <Route path="/jastip" element={<JastipPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailsPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/orders" element={<AdminManageOrdersPage />} />
          <Route path="/admin/orders/:orderId" element={<AdminOrderDetailsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/users" element={<AdminManageUsersPage />} />
          <Route path="/admin/users/:userId" element={<AdminUserDetailsPage />} />
          <Route path="/admin/vehicles" element={<AdminManageVehiclesPage />} />
          <Route path="/admin/chat" element={<AdminChatPage />} />
          <Route path="/admin/chat/:orderId" element={<AdminChatPage />} /> 
          <Route path="/admin/app-settings" element={<div><Layout><h1>Pengaturan Aplikasi (Segera Hadir)</h1></Layout></div>} />
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
