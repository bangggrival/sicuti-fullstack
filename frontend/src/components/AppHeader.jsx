import React, { useState, useEffect } from 'react';
import { ArrowLeft, Menu, Bell, Moon, Sun, Laptop, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Badge } from './ui/badge';

export default function AppHeader({ 
  showBack, 
  onBack, 
  activePage, 
  onNavigate, 
  onMenuClick 
}) {
  const { user } = useAuth();
  const [notifCount, setNotifCount] = useState(0);
  const [themeMode, setThemeMode] = useState(() => {
    // Remove legacy key if exists to ensure clean default
    if (localStorage.getItem('sicuti_theme')) {
      localStorage.removeItem('sicuti_theme');
    }
    return localStorage.getItem('sicuti_theme_mode') || 'system';
  });

  useEffect(() => {
    fetchNotifCount();
    const handleRefresh = () => fetchNotifCount();
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = false;
      if (themeMode === 'system') {
        isDark = mediaQuery.matches;
      } else if (themeMode === 'dark') {
        isDark = true;
      } else {
        isDark = false;
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    const handleSystemChange = () => {
      if (themeMode === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [themeMode]);

  const cycleTheme = () => {
    const nextMode = themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system';
    setThemeMode(nextMode);
    localStorage.setItem('sicuti_theme_mode', nextMode);
  };

  const fetchNotifCount = async () => {
    try {
      const res = await api.get('/notifikasi/unread-count');
      if (res.data.success) {
        setNotifCount(res.data.count);
      }
    } catch (err) {
      console.error('Error fetching notif count', err);
    }
  };

  const pageTitles = {
    'dashboard': 'Dashboard',
    'riwayat': 'Riwayat Cuti',
    'form-cuti': 'Buat Pengajuan Baru',
    'notifikasi': 'Notifikasi',
    'profil': 'Profil Saya',
    'detail': 'Detail Pengajuan',
    'kalender-tim': 'Kalender Tim',
    'manajemen-akun': 'Manajemen Akun'
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-all shadow-sm">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Section: Mobile Menu Toggle / Back Button / Title */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button 
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:bg-white dark:bg-slate-900 hover:text-blue-600 hover:shadow-md hover:-translate-y-[1px]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          
          {/* Page Title (Mobile & Desktop) */}
          <div className="flex items-center gap-2">
            {!showBack && (
              <div className="flex sm:hidden h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <FileText className="h-4 w-4" />
              </div>
            )}
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              <span className="sm:hidden">{showBack ? pageTitles[activePage] : 'SiPeCut'}</span>
              <span className="hidden sm:inline">{pageTitles[activePage] || 'SiPeCut'}</span>
            </h2>
          </div>
        </div>

        {/* Right Section: Mobile Notification / User Profile Summary */}
        <div className="flex items-center gap-4">
          {/* Bell Icon for Notifications */}
          <button 
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={() => onNavigate('notifikasi')}
          >
            <Bell className="h-5 w-5" />
            {notifCount > 0 && (
              <span className="absolute top-1 right-1 flex min-w-[16px] h-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {notifCount}
              </span>
            )}
          </button>

          {/* Automatic System / Light / Dark Theme Toggle */}
          <button
            onClick={cycleTheme}
            className="flex h-9 px-2.5 items-center justify-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-[12px] font-medium"
            title={`Mode Tema: ${themeMode === 'system' ? 'Otomatis (Mengikuti Sistem Perangkat)' : themeMode === 'dark' ? 'Mode Gelap' : 'Mode Terang'}`}
          >
            {themeMode === 'system' && (
              <>
                <Laptop className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden md:inline">Otomatis</span>
              </>
            )}
            {themeMode === 'light' && (
              <>
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="hidden md:inline">Terang</span>
              </>
            )}
            {themeMode === 'dark' && (
              <>
                <Moon className="h-4 w-4 text-indigo-400" />
                <span className="hidden md:inline">Gelap</span>
              </>
            )}
          </button>

          {/* Desktop/Tablet User Info snippet */}
          {user && (
            <div 
              className="hidden sm:flex items-center gap-3 cursor-pointer p-1.5 pr-4 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-white dark:bg-slate-900 shadow-sm transition-all"
              onClick={() => onNavigate('profil')}
            >
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-[12px] shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-none">{user.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
