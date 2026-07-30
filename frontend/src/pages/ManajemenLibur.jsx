import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Calendar, Trash2, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export default function ManajemenLibur({ showToast }) {
  const { user } = useAuth();
  const [libur, setLibur] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tanggal, setTanggal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchLibur = async () => {
    try {
      const res = await api.get('/libur');
      if (res.data.success) {
        setLibur(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data hari libur', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibur();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!tanggal || !keterangan.trim()) {
      showToast('Tanggal dan keterangan wajib diisi', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/libur', { tanggal, keterangan: keterangan.trim() });
      if (res.data.success) {
        showToast('Hari libur berhasil ditambahkan', 'success');
        setTanggal('');
        setKeterangan('');
        fetchLibur();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menambahkan hari libur', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const performDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await api.delete(`/libur/${deleteConfirmId}`);
      if (res.data.success) {
        showToast('Hari libur dihapus', 'success');
        fetchLibur();
      }
    } catch (err) {
      showToast('Gagal menghapus hari libur', 'error');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  if (user?.role !== 'pengawas' && user?.role !== 'kasie') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500">
        <AlertCircle className="w-12 h-12 mb-4 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800">Akses Ditolak</h2>
        <p>Hanya Pengawas dan Kepala Seksi yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          Manajemen Hari Libur
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Atur kalender hari libur nasional untuk perhitungan cuti.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Hari Libur</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Tanggal</label>
              <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
            </div>
            <div className="flex-[2]">
              <label className="text-sm font-medium mb-1 block">Keterangan</label>
              <Input placeholder="Contoh: Hari Kemerdekaan RI" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} required />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={submitting} className="w-full md:w-auto gap-2 bg-blue-600 hover:bg-blue-700">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Tambah
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Hari Libur</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : libur.length === 0 ? (
            <div className="py-8 text-center text-slate-500 border-2 border-dashed rounded-lg">Belum ada hari libur yang ditambahkan.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Keterangan</th>
                    <th className="px-4 py-3 w-20 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {libur.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {format(new Date(l.tanggal), 'dd MMMM yyyy', { locale: id })}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{l.keterangan}</td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(l.id)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Hari Libur</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus hari libur ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={performDelete} className="bg-rose-600 hover:bg-rose-700 text-white">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
