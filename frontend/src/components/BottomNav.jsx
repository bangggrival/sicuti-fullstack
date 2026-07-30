import React from 'react';
import { Home, Clock, Plus, CalendarDays, User, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav({ activePage, onNavigate }) {
  const { user } = useAuth();

  const navItems = [
    { key: 'dashboard', icon: Home, label: 'Beranda' },
    { key: 'riwayat', icon: Clock, label: 'Riwayat' },
  ];

  const navItemsRight = [
    { key: 'kalender-tim', icon: CalendarDays, label: 'Kalender' },
    { key: 'profil', icon: User, label: 'Profil' },
  ];

  if (!user) return null;

  const isSupervisor = ['pengawas', 'kasie'].includes(user.role);
  const centerTarget = isSupervisor ? 'manajemen-akun' : 'form-cuti';
  const CenterIcon = isSupervisor ? Users : Plus;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 pointer-events-none">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between px-2 py-2 shadow-lg pointer-events-auto">
        
        {/* Left Items */}
        <div className="flex w-[40%] justify-around items-center">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <button 
                key={item.key} 
                onClick={() => onNavigate(item.key)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-blue-50 dark:bg-slate-800' : 'bg-transparent'}`}>
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Floating Action Button */}
        <div className="relative w-[20%] flex justify-center">
          <button 
            onClick={() => onNavigate(centerTarget)}
            className={`absolute -top-10 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_8px_16px_rgb(37,99,235,0.4)] transition-transform hover:scale-105 active:scale-95 ${
              activePage === centerTarget ? 'ring-4 ring-blue-100 dark:ring-blue-900' : 'ring-4 ring-white dark:ring-slate-900'
            }`}
            title={isSupervisor ? "Kelola Akun Pegawai" : "Buat Pengajuan Cuti"}
          >
            <CenterIcon className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>

        {/* Right Items */}
        <div className="flex w-[40%] justify-around items-center">
          {navItemsRight.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <button 
                key={item.key} 
                onClick={() => onNavigate(item.key)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-blue-50 dark:bg-slate-800' : 'bg-transparent'}`}>
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
