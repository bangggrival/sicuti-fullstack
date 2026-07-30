import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppHeader from './components/AppHeader';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FormCuti from './pages/FormCuti';
import Riwayat from './pages/Riwayat';
import Detail from './pages/Detail';
import Notifikasi from './pages/Notifikasi';
import Profil from './pages/Profil';
import KalenderTim from './pages/KalenderTim';
import ManajemenAkun from './pages/ManajemenAkun';
import ManajemenLibur from './pages/ManajemenLibur';
import LupaSandi from './pages/LupaSandi';
import ResetSandi from './pages/ResetSandi';

function MainApp() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authPage, setAuthPage] = useState('login'); // login, lupa-sandi, reset-sandi
  const [resetToken, setResetToken] = useState(null);
  const [selectedDetailId, setSelectedDetailId] = useState(null);
  const [previousPage, setPreviousPage] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pwaUpdate, setPwaUpdate] = useState(null);

  useEffect(() => {
    if (!user) {
      setCurrentPage('dashboard');
    } else {
      if (user.role === 'pegawai' && ['manajemen-akun', 'manajemen-libur'].includes(currentPage)) {
        showToast('Akses ditolak: Fitur ini khusus Pengawas/Kasie', 'warning');
        setCurrentPage('dashboard');
      }
      if (['pengawas', 'kasie'].includes(user.role) && currentPage === 'form-cuti') {
        showToast('Akses ditolak: Fitur ini khusus Pegawai Pemohon', 'warning');
        setCurrentPage('dashboard');
      }
    }
  }, [user, currentPage]);

  useEffect(() => {
    const handlePwaUpdate = (e) => {
      setPwaUpdate(() => e.detail.update);
    };
    document.addEventListener('pwa-update-available', handlePwaUpdate);
    return () => document.removeEventListener('pwa-update-available', handlePwaUpdate);
  }, []);

  // Handle URL hash for reset password routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/reset-sandi/')) {
        const token = hash.replace('#/reset-sandi/', '');
        setResetToken(token);
        setAuthPage('reset-sandi');
      } else {
        setAuthPage('login');
      }
    };
    
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('sicuti_token');
    const sse = new EventSource(`http://localhost:3001/api/notifikasi/stream?token=${token}`);

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          showToast(data.message, data.type || 'info');
          // Trigger global refresh event
          window.dispatchEvent(new CustomEvent('refreshData'));
        }
      } catch (err) {
        console.error('SSE Error parsing data:', err);
      }
    };

    sse.onerror = () => {
      console.error('SSE connection lost');
      sse.close();
    };

    return () => {
      sse.close();
    };
  }, [user]);

  const [navData, setNavData] = useState(null);

  const handleNavigate = (page, data = null) => {
    setPreviousPage(currentPage);
    setCurrentPage(page);
    setNavData(data);
    if (page === 'detail') setSelectedDetailId(data);
    // Remove window.scrollTo because scroll area is now main
    const mainArea = document.getElementById('main-scroll-area');
    if (mainArea) {
      mainArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Close sidebar on resize to desktop to prevent state mismatches
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileOpen(false); // 1024px is lg breakpoint
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) {
    let AuthComponent = <Login showToast={showToast} onNavigate={(p) => {
      if (p === 'lupa-sandi') setAuthPage('lupa-sandi');
      else setAuthPage('login');
    }} />;
    
    if (authPage === 'lupa-sandi') {
      AuthComponent = <LupaSandi onNavigate={(p) => setAuthPage(p)} />;
    } else if (authPage === 'reset-sandi') {
      AuthComponent = <ResetSandi onNavigate={(p) => {
        window.location.hash = ''; // Clear hash
        setAuthPage('login');
      }} token={resetToken} />;
    }

    return (
      <>
        {AuthComponent}
        <Toast toast={toast} onClose={() => setToast(null)} />
      </>
    );
  }

  const getHeaderProps = () => {
    switch(currentPage) {
      case 'dashboard':
        return {};
      case 'detail':
        return { showBack: true, onBack: () => handleNavigate(previousPage || 'riwayat') };
      default:
        return { showBack: true, onBack: () => handleNavigate('dashboard') };
    }
  };

  return (
    <div className="flex h-screen w-full relative overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Background Orbs removed for solid clean background */}
      
      {/* Left Sidebar */}
      <Sidebar 
        activePage={currentPage} 
        onNavigate={handleNavigate}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <AppHeader 
          {...getHeaderProps()} 
          activePage={currentPage}
          onNavigate={handleNavigate}
          onMenuClick={() => setIsMobileOpen(true)}
        />
        <main id="main-scroll-area" className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 relative">
          <div className="max-w-6xl mx-auto pb-10">
            {currentPage === 'dashboard' && (
              <Dashboard 
                onNavigate={handleNavigate} 
                onSelectDetail={(id) => handleNavigate('detail', id)} 
              />
            )}
            {currentPage === 'riwayat' && (
              <Riwayat 
                initialFilter={navData?.filter || 'semua'}
                onSelectDetail={(id) => handleNavigate('detail', id)} 
              />
            )}
            {currentPage === 'form-cuti' && (
              <FormCuti onNavigate={handleNavigate} showToast={showToast} />
            )}
            {currentPage === 'detail' && (
              <Detail detailId={selectedDetailId} showToast={showToast} onBack={() => handleNavigate(previousPage || 'riwayat')} />
            )}
            {currentPage === 'notifikasi' && (
              <Notifikasi showToast={showToast} />
            )}
            {currentPage === 'profil' && (
              <Profil onNavigate={handleNavigate} showToast={showToast} />
            )}
            {currentPage === 'kalender-tim' && (
              <KalenderTim />
            )}
            {currentPage === 'manajemen-akun' && (
              <ManajemenAkun showToast={showToast} />
            )}
            {currentPage === 'manajemen-libur' && (
              <ManajemenLibur showToast={showToast} />
            )}
          </div>
          
          {/* Footer inside scroll area */}
          <footer className="mt-auto pt-10 pb-4 text-center text-[12px] text-slate-500 dark:text-slate-400">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-700/50 pt-4">
              <span>SiPeCut v1.0</span>
              <span>&copy; 2026 Seksi Pelayanan dan Informasi</span>
            </div>
          </footer>
        </main>
      </div>

      <BottomNav activePage={currentPage} onNavigate={handleNavigate} />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <AlertDialog open={!!pwaUpdate} onOpenChange={(open) => !open && setPwaUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pembaruan Tersedia</AlertDialogTitle>
            <AlertDialogDescription>
              Versi baru dari aplikasi telah tersedia. Muat ulang sekarang untuk memperbarui?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nanti</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pwaUpdate) pwaUpdate();
              setPwaUpdate(null);
            }} className="bg-blue-600 hover:bg-blue-700 text-white">
              Muat Ulang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
