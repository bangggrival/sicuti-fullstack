import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Textarea } from '../components/ui/textarea';
import { CheckCircle2, Clock, XCircle, Eye, User, FileText, Check, X, ArrowLeft, Loader2, MessageSquare, Upload, Download } from 'lucide-react';

export default function Detail({ detailId, showToast, onBack }) {
  const { user, refreshUser } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pengawasNote, setPengawasNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => { fetchDetail(); }, [detailId]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/pengajuan/${detailId}`);
      if (res.data.success) setDetail(res.data.data);
    } catch (err) {
      console.error('Error fetching detail', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePengawasAction = async (action) => {
    setSubmitting(true);
    try {
      const res = await api.put(`/pengajuan/${detailId}/keputusan`, { action, note: pengawasNote });
      if (res.data.success) {
        showToast(`Pengajuan berhasil ${action === 'disetujui' ? 'disetujui' : 'ditolak'}`, action === 'disetujui' ? 'success' : 'error');
        refreshUser();
        fetchDetail();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal update status', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('suratSakit', file);

    try {
      const res = await api.post(`/pengajuan/${detailId}/upload-surat`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        showToast('Surat sakit berhasil diunggah', 'success');
        fetchDetail();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengunggah surat sakit', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-20 text-[13px] text-slate-500 dark:text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" /> Memuat detail...
    </div>
  );
  if (!detail) return (
    <div className="py-20 text-center text-[13px] text-slate-500 dark:text-slate-400">Pengajuan tidak ditemukan.</div>
  );

  const getStatusInfo = (status) => {
    return { label: 'Diajukan', variant: 'default', icon: <CheckCircle2 className="h-4 w-4" />, desc: 'Telah diajukan' };
  };

  const st = getStatusInfo(detail.status);
  const formatDate = (str) => str ? new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

  const steps = [
    { num: '1', label: 'Pengajuan', sub: 'Tercatat', done: true, active: false }
  ];

  const infoRows = [
    ['Jenis Cuti', detail.jenisCuti, true],
    ['Tanggal Mulai', formatDate(detail.tanggalMulai)],
    ['Tanggal Selesai', formatDate(detail.tanggalSelesai)],
    ['Jumlah Hari', `${detail.jumlahHari} hari kerja`],
    ...(detail.penggantiTugas ? [['Pengganti Tugas', detail.penggantiTugas]] : []),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Pengajuan #{detail.kode}</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Dibuat {formatDate(detail.createdAt)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
      </div>

      {/* Step Tracker */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            {steps.map((step, idx) => (
              <React.Fragment key={step.num}>
                {idx > 0 && (
                  <div className={`h-px flex-1 mx-3 ${step.done ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold ${
                    step.done
                      ? (detail.status === 'ditolak' && idx === 1 ? 'bg-red-600 text-white' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900')
                      : step.active
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 ring-4 ring-slate-100 dark:ring-slate-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {step.done ? <Check className="h-3.5 w-3.5" /> : step.num}
                  </div>
                  <span className={`mt-2 text-[11px] text-center font-medium ${step.done || step.active ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {step.label}<br/><span className="font-normal">{step.sub}</span>
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-4">
          {/* Status */}
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                st.variant === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                st.variant === 'destructive' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                st.variant === 'warning' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' :
                'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              }`}>
                {st.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{st.label}</span>
                  <Badge variant={st.variant}>{detail.status.toUpperCase()}</Badge>
                </div>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{st.desc}</p>
              </div>
            </CardContent>
          </Card>

          {/* Detail Info */}
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" /> Detail Permohonan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-100">
                {infoRows.map(([label, value, highlight]) => (
                  <div key={label} className="flex justify-between py-3 text-[13px]">
                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                    <span className={`font-medium ${highlight ? 'text-blue-600' : 'text-slate-900 dark:text-slate-100'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alasan */}
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-500 dark:text-slate-400" /> Keterangan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                {detail.alasan}
              </p>
            </CardContent>
          </Card>

          {/* Lampiran Surat Sakit */}
          {detail.jenisCuti === 'sakit' && (
            <Card>
              <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" /> Surat Keterangan Sakit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {detail.suratSakitUrl ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 break-all">Lampiran_Surat_Sakit</span>
                      </div>
                      <a href={`http://localhost:3001${detail.suratSakitUrl}`} target="_blank" rel="noreferrer" className="shrink-0">
                        <Button variant="outline" size="sm" className="h-8">
                          <Download className="h-4 w-4 mr-1" /> Unduh
                        </Button>
                      </a>
                    </div>
                  ) : (
                    <div className="text-[13px] text-slate-500 dark:text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                      Belum ada surat keterangan sakit yang diunggah.
                    </div>
                  )}

                  {/* Allow upload if user is the requester, regardless of status */}
                  {user.id === detail.pegawaiId && (
                    <div className="pt-2">
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleUploadFile}
                      />
                      <Button 
                        variant="outline" 
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 dark:bg-blue-900/30"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Mengunggah...</> : <><Upload className="h-4 w-4 mr-2" /> {detail.suratSakitUrl ? 'Unggah Ulang Surat Sakit' : 'Unggah Surat Sakit'}</>}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Pemohon */}
          <Card>
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500 dark:text-slate-400" /> Pemohon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar style={{ backgroundColor: detail.pegawaiColor }} className="h-10 w-10 text-[13px]">
                  {detail.pegawaiAvatar}
                </Avatar>
                <div>
                  <div className="text-[14px] font-medium text-slate-900 dark:text-slate-100">{detail.pegawaiNama}</div>
                  <div className="text-[12px] text-slate-500 dark:text-slate-400">{detail.pegawaiJabatan}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{detail.pegawaiNip}</div>
                </div>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
}
