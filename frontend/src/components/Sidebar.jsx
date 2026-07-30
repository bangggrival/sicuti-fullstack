import React from 'react';
import { 
  FileText, LayoutDashboard, History, Plus, 
  Bell, User as UserIcon, LogOut, X, Calendar, Users, Map
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Badge } from './ui/badge';

export default function Sidebar({ activePage, onNavigate, isMobileOpen, setIsMobileOpen }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleLabel = {
    pegawai: 'Pegawai',
    pengawas: 'Pengawas',
    kasie: 'Kepala Seksi',
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'kalender-tim', label: 'Kalender Tim', icon: Calendar },
    { key: 'riwayat', label: 'Riwayat Cuti', icon: History },
    ...(user.role === 'pegawai' ? [{ key: 'form-cuti', label: 'Buat Pengajuan', icon: Plus }] : []),
    ...(user.role === 'pengawas' || user.role === 'kasie' ? [
      { key: 'manajemen-akun', label: 'Manajemen Akun', icon: Users },
      { key: 'manajemen-libur', label: 'Manajemen Libur', icon: Map }
    ] : []),
    { key: 'profil', label: 'Profil Saya', icon: UserIcon },
  ];


  const handleNavClick = (key) => {
    onNavigate(key);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-72 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-transform duration-300 lg:static lg:translate-x-0">
        {/* Brand Area */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-200 dark:border-slate-700 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[18px] font-bold text-slate-900 dark:text-slate-100 dark:text-white tracking-tight leading-none">SiPeCut</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">Sistem Pengajuan Cuti</span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            className="lg:hidden p-2 -mr-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info Area */}
        <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-700 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-lg shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-bold text-slate-900 dark:text-slate-100 dark:text-white break-words">{user.name}</h3>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 break-words">{user.jabatan}</p>
            </div>
          </div>
          <Badge variant="outline" className="w-full justify-center bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm text-blue-700 dark:text-blue-400">
            Role: {roleLabel[user.role]}
          </Badge>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 no-scrollbar">
          <p className="px-4 mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Main Menu</p>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2 transition-all outline-none"
              >
                <div className={`flex items-center justify-center p-1.5 rounded-xl transition-all ${isActive ? 'bg-white dark:bg-slate-900 dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' : 'bg-transparent text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300 group-hover:bg-slate-100 dark:bg-slate-800 dark:group-hover:bg-slate-800'}`}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <span className={`text-[14px] font-semibold transition-all ${isActive ? 'text-slate-900 dark:text-slate-100 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:text-slate-100 dark:text-slate-400 dark:group-hover:text-white'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Area: Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 dark:border-slate-700">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-slate-700">
            <button 
              onClick={handleLogout}
              className="group flex w-full items-center gap-3 rounded-xl transition-all outline-none"
            >
              <div className="flex items-center justify-center p-1.5 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 group-hover:bg-white dark:bg-slate-900 dark:group-hover:bg-rose-600 group-hover:text-rose-700 dark:group-hover:text-white group-hover:shadow-sm transition-all">
                <LogOut className="h-[18px] w-[18px]" />
              </div>
              <span className="text-[14px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Keluar
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
