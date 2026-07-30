import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { CheckCircle2, Clock, XCircle, Eye, Inbox, Search, ArrowUpRight, Loader2 } from 'lucide-react';

export default function Riwayat({ onSelectDetail, initialFilter = 'semua' }) {
  const [filter, setFilter] = useState(initialFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sync initialFilter prop if it changes
  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  useEffect(() => { 
    fetchRequests(); 
    const handleRefresh = () => fetchRequests(true);
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, [filter]);

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/pengajuan', { params: { status: filter } });
      if (res.data.success) setRequests(res.data.data);
    } catch (err) {
      console.error('Error fetching list', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusBadge = (st) => {
    return { label: 'Diajukan', variant: 'default', icon: <CheckCircle2 className="h-3 w-3 mr-1 text-slate-500" /> };
  };

  const formatDate = (str) => {
    if (!str) return '-';
    return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredRequests = requests.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      (r.pegawaiNama && r.pegawaiNama.toLowerCase().includes(term)) ||
      (r.kode && r.kode.toLowerCase().includes(term)) ||
      (r.jenisCuti && r.jenisCuti.toLowerCase().includes(term))
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Daftar Pengajuan Cuti</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Kelola dan pantau seluruh permohonan cuti</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
          <Input 
            type="text"
            placeholder="Cari nama, kode, jenis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-[13px]"
          />
        </div>
      </div>


      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-[13px] text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat data...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 mb-1">Belum Ada Pengajuan</h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">Daftar permohonan cuti masih kosong untuk kriteria ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-5 sm:px-6">Pegawai</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4 hidden md:table-cell">Periode</th>
                    <th className="py-3 px-4 text-center hidden sm:table-cell">Durasi</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-5 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {paginatedRequests.map(r => {
                    const st = getStatusBadge(r.status);
                    return (
                      <tr 
                        key={r.id} 
                        onClick={() => onSelectDetail(r.id)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-5 sm:px-6">
                          <div className="flex items-center gap-3">
                            <Avatar style={{ backgroundColor: r.pegawaiColor || '#1E293B' }} className="h-8 w-8 text-[11px]">
                              {r.pegawaiAvatar || 'ID'}
                            </Avatar>
                            <div>
                              <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{r.pegawaiNama || r.kode}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">#{r.kode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[13px] text-slate-700 dark:text-slate-300">{r.jenisCuti}</td>
                        <td className="py-3.5 px-4 text-[13px] text-slate-500 dark:text-slate-400 hidden md:table-cell">
                          {formatDate(r.tanggalMulai)} — {formatDate(r.tanggalSelesai)}
                        </td>
                        <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                          <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{r.jumlahHari}</span>
                          <span className="text-slate-500 dark:text-slate-400 ml-0.5 text-[11px]">hr</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant={st.variant}>{st.icon} {st.label}</Badge>
                        </td>
                        <td className="py-3.5 px-5 sm:px-6 text-right">
                          <Button variant="outline" size="sm" className="h-8 text-[12px]">
                            Detail <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {!loading && filteredRequests.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-[13px] text-slate-500 dark:text-slate-400">
                Menampilkan <span className="font-medium text-slate-900 dark:text-slate-100">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-medium text-slate-900 dark:text-slate-100">{Math.min(currentPage * itemsPerPage, filteredRequests.length)}</span> dari <span className="font-medium text-slate-900 dark:text-slate-100">{filteredRequests.length}</span> data
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
        </CardContent>
      </Card>
    </div>
  );
}
