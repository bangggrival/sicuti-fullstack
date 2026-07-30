import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function LupaSandi({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-xl shadow-amber-500/20">
            <ShieldAlert className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Lupa Kata Sandi?
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Prosedur pemulihan akun SiCuti.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[400px]">
        <Card className="border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Informasi Keamanan</CardTitle>
            <CardDescription>Cara mendapatkan kembali akses Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-4 mb-6">
              <p>
                Demi menjaga standar keamanan ketat untuk data kepegawaian, fitur **reset kata sandi mandiri dinonaktifkan** pada sistem ini.
              </p>
              <p>
                Jika Anda melupakan kata sandi Anda, silakan hubungi langsung <strong>Atasan (Pengawas)</strong> Anda atau <strong>Administrator HRD</strong>.
              </p>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg text-blue-800 dark:text-blue-300">
                Atasan Anda dapat mengatur ulang kata sandi Anda kembali ke bawaan (<strong>123456</strong>) melalui menu <strong>Manajemen Akun</strong> di Dasbor mereka.
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 h-11" 
              onClick={() => onNavigate('login')}
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Halaman Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
