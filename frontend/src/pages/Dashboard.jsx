import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Calendar, CheckCircle2, Clock, XCircle, Eye, Users, 
  Plus, Search, FileText, ArrowUpRight, TrendingUp,
  Inbox, Info, Palmtree, Loader2, BarChart2, PieChart as PieChartIcon, Download, X
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function Dashboard({ onNavigate, onSelectDetail }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [subordinates, setSubordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportMonth, setExportMonth] = useState('all');
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportFormat, setExportFormat] = useState('pdf');

  const handleExport = () => {
    // Filter data based on selected month and year
    const filteredData = requests.filter(r => {
      const dateStr = r.tanggalMulai || r.createdAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (exportYear && d.getFullYear() !== parseInt(exportYear, 10)) return false;
      if (exportMonth !== 'all' && d.getMonth() !== parseInt(exportMonth, 10)) return false;
      return true;
    });

    if (filteredData.length === 0) {
      alert('Tidak ada data pengajuan cuti pada periode yang dipilih.');
      return;
    }

    const monthName = exportMonth === 'all' 
      ? 'Semua Bulan' 
      : new Date(exportYear, parseInt(exportMonth, 10), 1).toLocaleDateString('id-ID', { month: 'long' });

    const periodeStr = `${monthName} ${exportYear}`;

      if (exportFormat === 'pdf') {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Kop Header Official PEMPROV DKI JAKARTA (Centered & Mathematically Aligned)
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42); // Dark Slate
        doc.text('PEMERINTAH PROVINSI DKI JAKARTA', pageWidth / 2, 13, { align: 'center' });
        
        doc.setFontSize(11.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('DINAS PERTAMANAN DAN HUTAN KOTA', pageWidth / 2, 18.5, { align: 'center' });

        doc.setFontSize(12.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138); // Navy 900
        doc.text('UNIT PENGELOLA TAMAN MARGASATWA RAGUNAN', pageWidth / 2, 24.5, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text('Jl. Harsono RM No. 1, Pasar Minggu, Jakarta Selatan 12550 | Telp: (021) 7805611 / 7806979', pageWidth / 2, 29.5, { align: 'center' });
        doc.text('Website: ragunanzoo.jakarta.go.id | Email: ragunanzoo@jakarta.go.id', pageWidth / 2, 33.5, { align: 'center' });

        // Official Double Kop Lines (Precise Margin: 14mm to 196mm)
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.8);
        doc.line(14, 37.5, pageWidth - 14, 37.5);
        doc.setLineWidth(0.2);
        doc.line(14, 38.7, pageWidth - 14, 38.7);

        // Document Title & Subtitle
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('LAPORAN REKAPITULASI PENGAJUAN CUTI PEGAWAI', pageWidth / 2, 47, { align: 'center' });

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Periode Laporan: ${periodeStr}`, pageWidth / 2, 53, { align: 'center' });

        // Metadata Info Card (Rounded Rect: 186mm Width, Margin 12mm)
        const nowStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(12, 58, pageWidth - 24, 15, 1.5, 1.5, 'FD');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        doc.text(`Tanggal Cetak   :  ${nowStr}`, 16, 63.5);
        doc.text(`Dicetak Oleh     :  ${user.name} (${user.role.toUpperCase()})`, 16, 68.5);

        doc.text(`Total Pengajuan  :  ${filteredData.length} Berkas`, pageWidth - 16, 63.5, { align: 'right' });
        doc.text(`Unit Kerja        :  UPT Taman Margasatwa Ragunan`, pageWidth - 16, 68.5, { align: 'right' });

        // Table Setup (Exact 186mm Total Column Width - NO WRAPPING)
        const tableColumn = ["No", "Kode", "Nama Pegawai", "NIP", "Jenis Cuti", "Tanggal Cuti", "Hari", "Status"];
        const tableRows = [];

        const statusLabel = {
          pending: 'Diajukan',
          diajukan: 'Diajukan',
          diketahui: 'Diketahui',
          disetujui: 'Disetujui',
          ditolak: 'Ditolak'
        };

        const jenisLabel = {
          tahunan: 'Cuti Tahunan',
          sakit: 'Cuti Sakit',
          alasan_penting: 'Alasan Penting',
          melahirkan: 'Cuti Melahirkan',
          besar: 'Cuti Besar',
          diluar_tanggungan: 'Di Luar Tanggungan'
        };

        filteredData.forEach((req, index) => {
          const tglMulai = req.tanggalMulai ? new Date(req.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
          const tglSelesai = req.tanggalSelesai ? new Date(req.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
          const rangeTgl = tglMulai === tglSelesai ? tglMulai : `${tglMulai} - ${tglSelesai}`;

          const rowData = [
            index + 1,
            req.kode || '-',
            req.pegawaiNama || user.name || '-',
            req.pegawaiNip || user.nip || '-',
            jenisLabel[req.jenisCuti] || req.jenisCuti,
            rangeTgl,
            `${req.jumlahHari} hr`,
            statusLabel[req.status] || req.status
          ];
          tableRows.push(rowData);
        });

        autoTable(doc, {
          startY: 77,
          margin: { left: 12, right: 12 },
          head: [tableColumn],
          body: tableRows,
          theme: 'striped',
          headStyles: {
            fillColor: [15, 23, 42], // Slate 900
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
            valign: 'middle',
            cellPadding: 2.5
          },
          bodyStyles: {
            fontSize: 7.5,
            textColor: [30, 41, 59],
            valign: 'middle',
            cellPadding: 2.5
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },  // No
            1: { cellWidth: 25, fontStyle: 'bold', halign: 'center' }, // Kode
            2: { cellWidth: 30 },                    // Nama Pegawai
            3: { cellWidth: 38, halign: 'center' },  // NIP (38mm guarantees single line 18 digits)
            4: { cellWidth: 26 },                    // Jenis Cuti
            5: { cellWidth: 26, halign: 'center' },  // Tanggal Cuti
            6: { halign: 'center', cellWidth: 13 },  // Hari
            7: { halign: 'center', cellWidth: 18 }   // Status (Total = 186mm)
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          didParseCell: function(data) {
            if (data.section === 'body' && data.column.index === 7) {
              data.cell.styles.textColor = [37, 99, 235]; // Blue 600
              data.cell.styles.fontStyle = 'bold';
            }
          }
        });

        // Signature & Summary Section
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 190;
        if (finalY + 52 > pageHeight - 15) {
          doc.addPage();
        }

        const sigY = (doc.lastAutoTable && finalY + 52 <= pageHeight - 15) ? finalY : 25;

        // Summary Card on Left
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(12, sigY + 5, 78, 22, 1, 1, 'FD');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('RINGKASAN REKAPITULASI', 16, sigY + 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Total Berkas Diajukan : ${filteredData.length} Berkas`, 16, sigY + 16);
        doc.text(`Status Laporan        : Diajukan (Tercatat)`, 16, sigY + 20);

        // Signature Block Centered on Right Side (x = 150mm)
        const sigCenterX = 150;
        const todayFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(`Jakarta, ${todayFormatted}`, sigCenterX, sigY + 5, { align: 'center' });
        doc.text(`Mengetahui,`, sigCenterX, sigY + 9, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text(`Kepala Unit Pengelola Taman Margasatwa Ragunan`, sigCenterX, sigY + 13, { align: 'center' });
        doc.text(`Dinas Pertamanan dan Hutan Kota DKI Jakarta`, sigCenterX, sigY + 17, { align: 'center' });

        // Signature Line Space (23mm)
        doc.setFont('helvetica', 'bold');
        doc.text(`Dr. Bambang Sugiarto, M.Si`, sigCenterX, sigY + 41, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(`NIP. 19780512 200312 1 002`, sigCenterX, sigY + 45, { align: 'center' });

        // Footer Page Numbers & Official Tag
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(`Dokumen Resmi UP Taman Margasatwa Ragunan — Dinas Pertamanan dan Hutan Kota DKI Jakarta`, 14, pageHeight - 7);
          doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
        }

        doc.save(`Rekap_Cuti_TM_Ragunan_${periodeStr.replace(/\s+/g, '_')}.pdf`);
      } else {
      // CSV Export
      const headers = ["No", "Kode", "Nama Pegawai", "Jenis Cuti", "Tanggal Mulai", "Tanggal Selesai", "Durasi (Hari)", "Status"];
      const rows = filteredData.map((req, index) => {
        return [
          index + 1,
          req.kode || '-',
          `"${req.pegawaiNama || user.name || '-'}"`,
          req.jenisCuti,
          req.tanggalMulai ? req.tanggalMulai.split('T')[0] : '-',
          req.tanggalSelesai ? req.tanggalSelesai.split('T')[0] : '-',
          req.jumlahHari,
          req.status
        ].join(',');
      });
      
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Rekap_Cuti_${periodeStr.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setIsExportOpen(false);
  };

  useEffect(() => { 
    fetchDashboardData(); 
    const handleRefresh = () => fetchDashboardData(true);
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, [user]);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/pengajuan');
      if (res.data.success) setRequests(res.data.data);
      if (['pengawas', 'kasie'].includes(user.role)) {
        const subRes = await api.get('/users/subordinates');
        if (subRes.data.success) setSubordinates(subRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { label: 'Menunggu', variant: 'warning', icon: <Clock className="h-3 w-3" /> },
      diketahui: { label: 'Diketahui', variant: 'default', icon: <Eye className="h-3 w-3" /> },
      disetujui: { label: 'Disetujui', variant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
      ditolak: { label: 'Ditolak', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> }
    };
    return map[status] || map.pending;
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

  // Calculate Chart Data
  const getTrendData = () => {
    // Get last 6 months
    const data = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString('id-ID', { month: 'short' });
      data.push({ name: monthName, total: 0, year: d.getFullYear(), month: d.getMonth() });
    }
    
    requests.forEach(r => {
      const dateStr = r.createdAt || r.tanggalMulai;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const match = data.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
      if (match) match.total += 1;
    });
    return data;
  };

  const getPieData = () => {
    const counts = {};
    requests.forEach(r => {
      const jc = r.jenisCuti || 'Lainnya';
      counts[jc] = (counts[jc] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: counts[key]
    })).sort((a, b) => b.value - a.value);
  };

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
  const trendData = getTrendData();
  const pieData = getPieData();

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  const isSupervisor = ['pengawas', 'kasie'].includes(user.role);
  const countDisetujui = requests.filter(r => r.status === 'disetujui').length;
  const countPending = requests.filter(r => ['pending', 'diajukan'].includes(r.status)).length;
  const countRejected = requests.filter(r => r.status === 'ditolak').length;

  const totalHariCuti = requests.reduce((acc, r) => acc + (parseInt(r.jumlahHari, 10) || 0), 0);

  const stats = isSupervisor ? [
    {
      label: 'Pegawai Binaan',
      value: subordinates.length,
      unit: 'orang',
      sub: 'Tersambung ke Pengawas',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      link: 'manajemen-akun'
    },
    {
      label: 'Total Pengajuan Masuk',
      value: requests.length,
      unit: 'berkas',
      sub: 'Pengajuan Cuti Pegawai',
      icon: FileText,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-900/30',
      link: 'riwayat'
    },
    {
      label: 'Total Hari Cuti',
      value: totalHariCuti,
      unit: 'hari',
      sub: 'Akumulasi Durasi Cuti',
      icon: Calendar,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      link: 'riwayat'
    }
  ] : [
    {
      label: 'Sisa Cuti Tahunan',
      value: user.sisaCuti,
      unit: 'hari',
      sub: 'Kuota 12 hari/tahun',
      icon: Palmtree,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      label: 'Total Pengajuan Saya',
      value: requests.length,
      unit: 'berkas',
      sub: 'Riwayat Pengajuan',
      icon: FileText,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-900/30',
      link: 'riwayat'
    },
    {
      label: 'Sisa Ijin Sabtu',
      value: user.sisaCutiSabtu ?? 1,
      unit: 'hari',
      sub: 'Jatah 1x / Tahun',
      icon: Calendar,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      link: 'profil'
    },
    {
      label: 'Sisa Ijin Minggu',
      value: user.sisaCutiMinggu ?? 1,
      unit: 'hari',
      sub: 'Jatah 1x / Tahun',
      icon: Calendar,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-900/30',
      link: 'profil'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Selamat datang, {user.name}
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — Seksi Pelayanan dan Informasi
          </p>
        </div>
        {user.role === 'pegawai' && (
          <Button onClick={() => onNavigate('form-cuti')} size="sm" className="w-full sm:w-auto flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" /> Buat Pengajuan
          </Button>
        )}
        {['pengawas', 'kasie'].includes(user.role) && (
          <Button onClick={() => setIsExportOpen(true)} size="sm" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Download className="h-4 w-4" /> Cetak Rekap
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card 
              key={i} 
              className="group hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:border-blue-200 dark:hover:border-blue-900"
              onClick={() => onNavigate(s.link || 'riwayat')}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
                    s.color.includes('blue') ? 'from-blue-100 to-blue-50 text-blue-600 shadow-[0_4px_14px_0_rgb(37,99,235,0.1)] dark:from-blue-900/40 dark:to-blue-900/10' :
                    s.color.includes('emerald') ? 'from-emerald-100 to-emerald-50 text-emerald-600 shadow-[0_4px_14px_0_rgb(16,185,129,0.1)] dark:from-emerald-900/40 dark:to-emerald-900/10' :
                    s.color.includes('amber') ? 'from-amber-100 to-amber-50 text-amber-600 shadow-[0_4px_14px_0_rgb(245,158,11,0.1)] dark:from-amber-900/40 dark:to-amber-900/10' :
                    'from-sky-100 to-sky-50 text-sky-600 shadow-[0_4px_14px_0_rgb(14,165,233,0.1)] dark:from-sky-900/40 dark:to-sky-900/10'
                  } group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{s.value}</p>
                  <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{s.unit}</span>
                </div>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-2 font-medium">{s.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-slate-50 dark:border-slate-700/50 pb-4">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-blue-600" />
              Tren Pengajuan (6 Bulan Terakhir)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-2 px-2 sm:px-6">
            <div className="h-[250px] w-full min-w-0">
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="total" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="border-b border-slate-50 dark:border-slate-700/50 pb-4">
            <CardTitle className="text-[15px] flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-emerald-600" />
              Proporsi Jenis Cuti
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-2">
            <div className="h-[250px] w-full min-w-0">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="99%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-[13px] text-slate-500 dark:text-slate-400">
                  Belum ada data pengajuan
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Requests Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <CardTitle>
                  {user.role === 'pegawai' ? 'Pengajuan Terbaru' : 'Pengajuan Perlu Ditinjau'}
                </CardTitle>
                <CardDescription className="mt-1">Data pengajuan mutakhir dari sistem</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <Input 
                    type="text"
                    placeholder="Cari nama/kode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-[13px]"
                  />
                </div>
                <Button onClick={() => onNavigate('riwayat')} variant="outline" size="sm">
                  Lihat Semua
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Memuat data...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
                  <Inbox className="h-10 w-10 stroke-[1.5] mb-3" />
                  <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Tidak ada pengajuan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-700 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="py-3 px-5 sm:px-6">Pegawai</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Tanggal</th>
                        <th className="py-3 px-4 text-center">Durasi</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right pr-5 sm:pr-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRequests.slice(0, 6).map(r => {
                        const st = getStatusBadge(r.status);
                        return (
                          <tr 
                            key={r.id} 
                            onClick={() => onSelectDetail(r.id)}
                            className="hover:bg-slate-50 dark:bg-slate-800 transition-colors cursor-pointer group"
                          >
                            <td className="py-3.5 px-5 sm:px-6">
                              <div className="flex items-center gap-3">
                                <Avatar style={{ backgroundColor: r.pegawaiColor || '#1E293B' }} className="h-8 w-8 text-[11px]">
                                  {r.pegawaiAvatar || 'ID'}
                                </Avatar>
                                <div>
                                  <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{r.pegawaiNama || r.kode}</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.jenisCuti}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 hidden sm:table-cell text-[13px] text-slate-600 dark:text-slate-400">
                              {formatDate(r.tanggalMulai)} — {formatDate(r.tanggalSelesai)}
                            </td>
                            <td className="py-3.5 px-4 text-center text-[13px]">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{r.jumlahHari}</span>
                              <span className="text-slate-500 dark:text-slate-400 ml-0.5">hr</span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <Badge variant={st.variant}>
                                {st.icon} {st.label}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-4 text-right pr-5 sm:pr-6">
                              <ArrowUpRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors inline-block" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Sidebar Widgets */}
        <div className="space-y-4">
          {user.role === 'pegawai' && (
            <Card>
              <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="flex items-center gap-2">
                  <Palmtree className="h-4 w-4 text-slate-500 dark:text-slate-400" /> Kuota Cuti
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-[13px] mb-2">
                    <span className="text-slate-500 dark:text-slate-400">Cuti Tahunan</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{user.sisaCuti} / 12 hari</span>
                  </div>
                  <Progress value={Math.round((user.sisaCuti / 12) * 100)} className="h-2" />
                </div>
                <div className="space-y-2.5">
                  {[
                    ['Terpakai', `${12 - user.sisaCuti} hari`],
                    ['Pengawas', user.pengawasName || 'Belum Ditentukan'],
                    ['Status', 'Aktif'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[13px]">
                      <span className="text-slate-500 dark:text-slate-400">{k}</span>
                      <span className={`font-medium ${k === 'Status' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {['pengawas', 'kasie'].includes(user.role) && (
            <Card>
              <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" /> Pegawai Binaan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subordinates.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar style={{ backgroundColor: emp.color }} className="h-8 w-8 text-[11px]">{emp.avatar}</Avatar>
                        <div>
                          <div className="text-[13px] font-medium text-slate-900 dark:text-slate-100">{emp.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{emp.jabatan}</div>
                        </div>
                      </div>
                      <Badge variant={emp.activeCuti ? 'warning' : 'success'}>
                        {emp.activeCuti ? 'Cuti' : 'Hadir'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="p-5">
              <h4 className="text-[13px] font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                <Info className="h-4 w-4 text-slate-500 dark:text-slate-400" /> Alur Pengajuan
              </h4>
              <div className="space-y-3 text-[13px]">
                {[
                  ['1', 'Pegawai', 'Membuat pengajuan via form, saldo cuti langsung terpotong'],
                  ['2', 'Sistem', 'Mencatat pengajuan dengan status "Diajukan"'],
                ].map(([num, role, desc]) => (
                  <div key={num} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 shrink-0 mt-0.5">{num}</div>
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{role}</span>
                      <span className="text-slate-500 dark:text-slate-400"> — {desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Export Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <CardTitle className="text-[16px] flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" /> Ekspor Rekap Cuti
              </CardTitle>
              <button 
                onClick={() => setIsExportOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Bulan</label>
                <select 
                  className="flex h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[13px] text-slate-900 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  value={exportMonth}
                  onChange={e => setExportMonth(e.target.value)}
                >
                  <option value="all">-- Semua Bulan --</option>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>
                      {new Date(0, i).toLocaleDateString('id-ID', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Tahun</label>
                <Input 
                  type="number"
                  value={exportYear}
                  onChange={e => setExportYear(e.target.value)}
                  className="h-10 text-[13px]"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-300 block mb-1.5">Format Laporan</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="exportFormat" 
                      value="pdf" 
                      checked={exportFormat === 'pdf'}
                      onChange={e => setExportFormat(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    PDF (Rapi)
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="exportFormat" 
                      value="csv" 
                      checked={exportFormat === 'csv'}
                      onChange={e => setExportFormat(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    Excel / CSV
                  </label>
                </div>
              </div>
              <div className="pt-2">
                <Button onClick={handleExport} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Unduh Laporan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
