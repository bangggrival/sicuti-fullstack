import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import { FileText, LogIn, Loader2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { name: 'Ahmad Fauzi', role: 'Pegawai', username: 'ahmad', pass: '123456', avatar: 'AF', color: '#3B82F6' },
  { name: 'Siti Rahayu', role: 'Pegawai', username: 'siti', pass: '123456', avatar: 'SR', color: '#8B5CF6' },
  { name: 'Drs. Hendra Wijaya', role: 'Pengawas', username: 'hendra', pass: '123456', avatar: 'HW', color: '#F59E0B' },
  { name: 'Ir. Dewi Lestari', role: 'Pengawas', username: 'dewi', pass: '123456', avatar: 'DL', color: '#EC4899' },
  { name: 'Dr. Bambang Sugiarto', role: 'Kepala Seksi', username: 'bambang', pass: '123456', avatar: 'BS', color: '#06B6D4' }
];

export default function Login({ showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToast('Username dan Password wajib diisi', 'error');
      return;
    }
    const res = await login(username, password);
    if (res.success) {
      showToast(`Selamat datang, ${res.user.name.split(' ')[0]}!`, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleDemoClick = (acc) => {
    setUsername(acc.username);
    setPassword(acc.pass);
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative bg-slate-50 dark:bg-slate-950">
      {/* Orbs removed */}

      <div className="w-full max-w-[420px] p-4 sm:p-6 relative z-10">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <FileText className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">SiPeCut</h1>
          <p className="mt-1.5 text-[14px] text-slate-500 dark:text-slate-400 font-medium">Sistem Pengajuan Cuti</p>
        </div>

        {/* Login Card */}
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Masuk ke Akun</CardTitle>
            <CardDescription className="text-[13px]">Gunakan Username dan password Anda untuk masuk</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                  Username
                </label>
                <Input 
                  type="text" 
                  placeholder="Masukkan username Anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 focus:bg-white dark:bg-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex justify-between items-center w-full block">
                  <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Kata Sandi</span>
                  <button 
                    type="button" 
                    onClick={() => onNavigate && onNavigate('lupa-sandi')}
                    className="text-[12px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Lupa Sandi?
                  </button>
                </label>
                <Input 
                  type="password" 
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 focus:bg-white dark:bg-slate-900"
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Memproses...</>
                ) : (
                  <><LogIn className="h-4 w-4" /> Masuk ke Dashboard</>
                )}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 border-t border-slate-200 dark:border-slate-700/50 pt-5">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Akun Demo — Klik untuk isi otomatis
              </p>
              <div className="space-y-1">
                {DEMO_ACCOUNTS.map((acc, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleDemoClick(acc)}
                    className="flex items-center justify-between w-full rounded-xl p-3 text-left transition-all duration-300 hover:bg-white dark:bg-slate-900 hover:shadow-sm border border-transparent hover:border-slate-200 dark:border-slate-700/50 group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar style={{ backgroundColor: acc.color }} className="h-9 w-9 text-[12px] shadow-sm">
                        {acc.avatar}
                      </Avatar>
                      <div>
                        <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{acc.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{acc.role}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-md">@{acc.username}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
