import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, PlusCircleIcon, TicketIcon, ShoppingBagIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { User } from '../types'; // Assuming User type has role

interface BottomNavProps {
  userRole: User['role'] | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({ userRole }) => {
  const navItems = [
    { path: userRole === 'admin' ? '/admin' : '/', label: 'Beranda', icon: HomeIcon }, // Dynamic path for Beranda
    { path: '/book', label: 'Pesan', icon: PlusCircleIcon },
    { path: '/orders', label: 'Pesanan', icon: TicketIcon },
    { path: '/jastip', label: 'Jastip', icon: ShoppingBagIcon },
    { path: '/account', label: 'Akun', icon: UserCircleIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 shadow-top-lg border-t border-gray-700 z-50">
      <div className="container mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.label} // Use label or a unique key if path can change but label is static
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-gray-400 hover:text-yellow-400 transition-colors duration-200 p-2 
              ${isActive ? 'active-nav-link' : ''}`
            }
          >
            <item.icon className="h-6 w-6 mb-0.5" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
