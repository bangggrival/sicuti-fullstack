import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FileText, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../api/client';

export default function ResetSandi({ onNavigate, token }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Kedua kolom sandi wajib diisi');
      return;
    }
    if (password !== confirmPassword) {
      setError('Kata sandi tidak cocok');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/reset-password', { token, newPassword: password });
      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mereset kata sandi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20">
            <FileText className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Buat Sandi Baru
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Masukkan kata sandi baru untuk akun Anda.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[400px]">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Reset Sandi</CardTitle>
            <CardDescription>Keamanan akun</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Berhasil</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Kata sandi Anda telah berhasil diubah. Silakan masuk menggunakan kata sandi yang baru.
                </p>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onNavigate('login')}>
                  Kembali ke Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg text-sm font-medium border border-rose-100 dark:border-rose-900/50">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <Input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 block w-full h-11"
                      placeholder="Masukkan sandi baru"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Ulangi Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 block w-full h-11"
                      placeholder="Konfirmasi sandi baru"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white mt-2" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Simpan Sandi Baru'}
                </Button>
                
                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-sm font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
