import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { FileText, Bell, LogOut, ChevronRight, User, Building2 } from 'lucide-react';

export default function Profil({ onNavigate, showToast }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const roleLabel = { pegawai: 'Pegawai', pengawas: 'Pengawas' };

  const handleLogout = () => {
    logout();
    showToast('Berhasil keluar dari aplikasi', 'info');
  };

  const profileFields = [
    ['Nama Lengkap', user.name],
    ['NIP', user.nip, true],
    ['Jabatan', `${user.jabatan} (${roleLabel[user.role]})`],
    ['Unit Kerja', user.unit],
    ...(user.role === 'pegawai' ? [
      ['Pengawas Langsung', user.pengawasName ? `${user.pengawasName} ${user.pengawasWa && user.pengawasWa !== '-' ? `(WA: ${user.pengawasWa})` : ''}` : 'Belum Ditentukan', false, true],
      ['Sisa Cuti Tahunan', `${user.sisaCuti} hari`, false, true],
      ['Sisa Ijin Sabtu', `${user.sisaCutiSabtu ?? 1} kali`, false, false],
      ['Sisa Ijin Minggu', `${user.sisaCutiMinggu ?? 1} kali`, false, false]
    ] : []),
  ];

  const quickLinks = [
    { label: 'Daftar Pengajuan', desc: 'Lihat semua riwayat permohonan', icon: FileText, page: 'riwayat', color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' },
    { label: 'Notifikasi', desc: 'Pemberitahuan akun', icon: Bell, page: 'notifikasi', color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Avatar 
              style={{ backgroundColor: user.color }} 
              className="h-16 w-16 text-xl font-semibold shrink-0"
            >
              {user.avatar}
            </Avatar>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{user.name}</h1>
                <Badge variant="secondary">{roleLabel[user.role]}</Badge>
              </div>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{user.jabatan} · {user.unit}</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">NIP: {user.nip}</p>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Info */}
        <Card className="sm:col-span-2">
          <CardContent className="p-5 sm:p-6">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Detail Profil</h3>
            <div className="divide-y divide-slate-100">
              {profileFields.map(([label, value, isMono, isHighlight]) => (
                <div key={label} className="flex justify-between py-3 text-[13px]">
                  <span className="text-slate-500 dark:text-slate-400">{label}</span>
                  <span className={`font-medium ${isMono ? 'font-mono' : ''} ${isHighlight ? 'text-blue-600' : 'text-slate-900 dark:text-slate-100'}`}>{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-0 divide-y divide-slate-100">
              {quickLinks.map(link => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.page}
                    onClick={() => onNavigate(link.page)}
                    className="flex items-center gap-3 w-full p-4 text-left hover:bg-slate-50 dark:bg-slate-800 transition-colors"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${link.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100">{link.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{link.desc}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut className="h-4 w-4" /> Keluar dari Akun
          </Button>
        </div>
      </div>
    </div>
  );
}
