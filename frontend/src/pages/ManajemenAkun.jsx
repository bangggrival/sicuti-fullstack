import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Loader2, UserPlus, Edit2, Shield, User, X, Trash2, Key } from 'lucide-react';
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
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ManajemenAkun({ showToast }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [resetConfirmId, setResetConfirmId] = useState(null);
  const [resetConfirmName, setResetConfirmName] = useState('');
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    nip: '',
    username: '',
    name: '',
    role: 'pegawai',
    jabatan: '',
    unit: '',
    noWa: '',
    password: '',
    sisaCuti: 12,
    sisaCutiSabtu: 1,
    sisaCutiMinggu: 1,
    pengawasId: null
  });

  useEffect(() => {
    if (user.role === 'pengawas' || user.role === 'kasie') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      showToast('Gagal mengambil data akun', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (u = null) => {
    if (u) {
      setEditingUser(u);
      setFormData({
        nip: u.nip,
        username: u.username,
        name: u.name,
        role: u.role,
        jabatan: u.jabatan,
        unit: u.unit,
        noWa: u.noWa || '',
        password: '',
        sisaCuti: u.sisaCuti ?? 12,
        sisaCutiSabtu: u.sisaCutiSabtu ?? 1,
        sisaCutiMinggu: u.sisaCutiMinggu ?? 1,
        pengawasId: u.pengawasId || null
      });
    } else {
      setEditingUser(null);
      setFormData({ nip: '', username: '', name: '', role: 'pegawai', jabatan: '', unit: '', noWa: '', password: '', sisaCuti: 12, sisaCutiSabtu: 1, sisaCutiMinggu: 1, pengawasId: null });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nip: formData.nip,
        username: formData.username,
        name: formData.name,
        role: formData.role,
        jabatan: formData.jabatan,
        unit: formData.unit,
        noWa: formData.noWa,
        sisaCuti: formData.sisaCuti,
        sisaCutiSabtu: formData.sisaCutiSabtu,
        sisaCutiMinggu: formData.sisaCutiMinggu,
        pengawasId: formData.pengawasId || null
      };
      
      if (editingUser) {
        if (formData.password) payload.password = formData.password;
        const res = await api.put(`/users/${editingUser.id}`, payload);
        if (res.data.success) {
          showToast('Akun berhasil diperbarui', 'success');
          setIsModalOpen(false);
          fetchUsers();
        }
      } else {
        // Create mode
        if (!formData.password) {
          showToast('Kata sandi wajib diisi untuk akun baru', 'error');
          return;
        }
        if (!formData.username) {
          showToast('Username wajib diisi', 'error');
          return;
        }
        payload.password = formData.password;
        const res = await api.post('/users', payload);
        if (res.data.success) {
          showToast('Akun berhasil ditambahkan', 'success');
          setIsModalOpen(false);
          fetchUsers();
        }
      }
    } catch (err) {
      console.error('Error saving user:', err);
      showToast(err.response?.data?.message || 'Terjadi kesalahan', 'error');
    }
  };

  const performDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await api.delete(`/users/${deleteConfirmId}`);
      if (res.data.success) {
        showToast('Akun berhasil dihapus', 'success');
        fetchUsers();
      }
    } catch (err) {
      showToast('Gagal menghapus akun', 'error');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const performResetPassword = async () => {
    if (!resetConfirmId) return;
    try {
      const res = await api.put(`/users/${resetConfirmId}/reset-password`);
      if (res.data.success) {
        showToast(res.data.message || 'Kata sandi berhasil direset', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mereset kata sandi', 'error');
    } finally {
      setResetConfirmId(null);
      setResetConfirmName('');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (user.role !== 'pengawas' && user.role !== 'kasie') {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 dark:text-slate-400">
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Manajemen Akun</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Kelola data pegawai, pengawas, dan hak akses.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            placeholder="Cari NIP, Nama, Role..." 
            className="w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button onClick={() => handleOpenModal()} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Akun
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="py-3 px-4 font-medium">Pegawai</th>
                  <th className="py-3 px-4 font-medium hidden sm:table-cell">Jabatan & Unit</th>
                  <th className="py-3 px-4 font-medium">Role</th>
                  <th className="py-3 px-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredUsers.length > 0 ? (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-[11px]">
                            {u.avatar || u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{u.name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{u.nip}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <div className="text-[13px] text-slate-700 dark:text-slate-300">{u.jabatan}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{u.unit}</div>
                        {u.pengawasId && (
                          <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-1">
                            Atasan: {users.find(spv => spv.id === u.pengawasId)?.name || '-'}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={u.role === 'pengawas' ? 'secondary' : 'outline'} 
                          className="capitalize"
                        >
                          {u.role === 'pengawas' ? <Shield className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Reset Kata Sandi"
                            className="h-8 w-8 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/40 dark:hover:text-amber-400 text-slate-400" 
                            onClick={() => { setResetConfirmId(u.id); setResetConfirmName(u.name); }}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(u)}>
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirmId(u.id)}>
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">
                      Tidak ada data akun yang sesuai
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {!loading && filteredUsers.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <span className="text-[13px] text-slate-500 dark:text-slate-400">
              Menampilkan <span className="font-medium text-slate-900 dark:text-slate-100">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-slate-900 dark:text-slate-100">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> dari <span className="font-medium text-slate-900 dark:text-slate-100">{filteredUsers.length}</span> data
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg my-auto max-h-[90vh] overflow-y-auto shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <CardTitle className="text-[16px]">
                {editingUser ? 'Edit Akun' : 'Tambah Akun Baru'}
              </CardTitle>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">NIP</label>
                    <Input 
                      required 
                      value={formData.nip}
                      onChange={(e) => setFormData({...formData, nip: e.target.value})}
                      disabled={!!editingUser}
                      placeholder="Masukkan NIP"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Username</label>
                    <Input 
                      required 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="Masukkan Username"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Nama Lengkap</label>
                  <Input 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Masukkan Nama Lengkap"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Role (Peran)</label>
                  <select 
                    className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-[14px] text-slate-900 dark:text-slate-100 shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-400"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="pegawai">Pegawai</option>
                    <option value="pengawas">Pengawas</option>
                    <option value="kasie">Kepala Seksi</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Pengawas / Atasan Langsung</label>
                  <select 
                    className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-[14px] text-slate-900 dark:text-slate-100 shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-400"
                    value={formData.pengawasId || ''}
                    onChange={(e) => setFormData({...formData, pengawasId: e.target.value ? parseInt(e.target.value, 10) : null})}
                  >
                    <option value="">-- Pilih Atasan / Pengawas --</option>
                    {users.filter(u => u.role === 'pengawas' || u.role === 'kasie').map(spv => (
                      <option key={spv.id} value={spv.id}>
                        {spv.name} ({spv.role === 'kasie' ? 'Kasie' : 'Pengawas'}) {spv.noWa && spv.noWa !== '-' ? `[WA: ${spv.noWa}]` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Jabatan</label>
                    <Input 
                      required 
                      value={formData.jabatan}
                      onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                      placeholder="Cth: Staff IT"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Unit</label>
                    <Input 
                      required 
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      placeholder="Cth: Seksi Layanan"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">No WhatsApp</label>
                    <Input 
                      type="tel"
                      value={formData.noWa}
                      onChange={(e) => setFormData({...formData, noWa: e.target.value})}
                      placeholder="Cth: 081234567890"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Sisa Cuti Tahunan</label>
                    <Input 
                      type="number"
                      min="0"
                      value={formData.sisaCuti}
                      onChange={(e) => setFormData({...formData, sisaCuti: parseInt(e.target.value) || 0})}
                      placeholder="Cth: 12"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Ijin Sabtu</label>
                    <Input 
                      type="number"
                      min="0"
                      value={formData.sisaCutiSabtu}
                      onChange={(e) => setFormData({...formData, sisaCutiSabtu: parseInt(e.target.value) || 0})}
                      placeholder="Cth: 1"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Ijin Minggu</label>
                    <Input 
                      type="number"
                      min="0"
                      value={formData.sisaCutiMinggu}
                      onChange={(e) => setFormData({...formData, sisaCutiMinggu: parseInt(e.target.value) || 0})}
                      placeholder="Cth: 1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                    {editingUser ? 'Password Baru (Opsional)' : 'Password'}
                  </label>
                  <Input 
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={editingUser ? "Kosongkan jika tidak diubah" : "Masukkan password default"}
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Simpan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.
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

      <AlertDialog open={!!resetConfirmId} onOpenChange={(open) => {
        if (!open) {
          setResetConfirmId(null);
          setResetConfirmName('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Kata Sandi</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin mereset kata sandi untuk <strong>{resetConfirmName}</strong> ke bawaan (123456)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={performResetPassword} className="bg-blue-600 hover:bg-blue-700 text-white">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
