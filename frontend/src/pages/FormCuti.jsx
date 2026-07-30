import React, { useState } from 'react';
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';
import { Calendar as CalendarPicker } from '../components/ui/calendar';
import { cn } from '../lib/utils';
import { Calendar, FileText, User, Send, Check, ArrowLeft, CalendarDays, Stethoscope, Baby, ClipboardList, Award, PauseCircle, Loader2 } from 'lucide-react';

export default function FormCuti({ onNavigate, showToast }) {
  const { user, refreshUser } = useAuth();
  const [hariLibur, setHariLibur] = useState([]);

  React.useEffect(() => {
    const fetchLibur = async () => {
      try {
        const res = await api.get('/libur');
        if (res.data.success) {
          setHariLibur(res.data.data.map(h => new Date(h.tanggal).getTime()));
        }
      } catch (err) {
        console.error('Error fetching hari libur', err);
      }
    };
    fetchLibur();
  }, []);

  const JENIS_CUTI = [
    { id: 'tahunan', label: 'Cuti Tahunan', icon: CalendarDays, desc: `Sisa: ${user.sisaCuti} hari` },
    { id: 'sakit', label: 'Cuti Sakit', icon: Stethoscope, desc: 'Surat dokter' },
    { id: 'melahirkan', label: 'Cuti Melahirkan', icon: Baby, desc: 'Maks 90 hari' },
    { id: 'alasan_penting', label: 'Alasan Penting', icon: ClipboardList, desc: 'Keluarga/duka' },
    { id: 'besar', label: 'Cuti Besar', icon: Award, desc: 'Masa kerja >5 thn' },
    { id: 'diluar_tanggungan', label: 'Di Luar Tanggungan', icon: PauseCircle, desc: 'Tanpa gaji' }
  ];
  const [jenisCuti, setJenisCuti] = useState('tahunan');
  const [date, setDate] = useState({ from: undefined, to: undefined });
  const [alasan, setAlasan] = useState('');
  const [penggantiTugas, setPenggantiTugas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    let count = 0;
    const curr = new Date(s);
    while (curr <= e) {
      const day = curr.getDay();
      const isWeekend = day === 0 || day === 6;
      const isLibur = hariLibur.includes(curr.getTime());
      
      if (!isWeekend && !isLibur) {
        count++;
      }
      curr.setDate(curr.getDate() + 1);
    }
    return count;
  };

  const checkWeekends = (start, end) => {
    if (!start || !end) return { sabtu: false, minggu: false };
    const s = new Date(start);
    const e = new Date(end);
    let sabtu = false;
    let minggu = false;
    const curr = new Date(s);
    while (curr <= e) {
      if (curr.getDay() === 6) sabtu = true;
      if (curr.getDay() === 0) minggu = true;
      curr.setDate(curr.getDate() + 1);
    }
    return { sabtu, minggu };
  };

  const rawDays = () => {
    if (!date?.from || !date?.to) return 0;
    const s = new Date(date.from);
    const e = new Date(date.to);
    return e >= s ? Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1 : 0;
  };

  const finalJumlahHari = jenisCuti === 'tahunan' ? calculateDays(date?.from, date?.to) : rawDays();
  const { sabtu: includesSabtu, minggu: includesMinggu } = checkWeekends(date?.from, date?.to);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jenisCuti || !date?.from || !date?.to || !alasan.trim()) {
      showToast('Lengkapi semua field yang wajib diisi, termasuk rentang tanggal cuti', 'error');
      return;
    }
    const tanggalMulai = format(date.from, 'yyyy-MM-dd');
    const tanggalSelesai = format(date.to, 'yyyy-MM-dd');
    if (finalJumlahHari <= 0) {
      showToast('Tanggal selesai harus setelah tanggal mulai', 'error');
      return;
    }
    if (jenisCuti === 'tahunan' && finalJumlahHari > user.sisaCuti) {
      showToast(`Sisa cuti tahunan Anda (${user.sisaCuti} hari) tidak mencukupi untuk ${finalJumlahHari} hari`, 'error');
      return;
    }

    if (jenisCuti === 'tahunan' || jenisCuti === 'alasan_penting') {
      if (includesSabtu && user.sisaCutiSabtu <= 0) {
        showToast('Jatah ijin hari Sabtu Anda tahun ini sudah habis.', 'error');
        return;
      }
      if (includesMinggu && user.sisaCutiMinggu <= 0) {
        showToast('Jatah ijin hari Minggu Anda tahun ini sudah habis.', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await api.post('/pengajuan', {
        jenisCuti, tanggalMulai, tanggalSelesai, jumlahHari: finalJumlahHari,
        alasan: alasan.trim(), penggantiTugas: penggantiTugas.trim()
      });
      if (res.data.success) {
        const pName = res.data.pengawas?.name;
        const pWa = res.data.pengawas?.no_wa;

        setSuccessData({
          kode: res.data.data.kode,
          pengawasName: pName,
          pengawasWa: pWa,
          jenisCuti: jenisCuti,
          tanggalMulai: tanggalMulai,
          tanggalSelesai: tanggalSelesai,
          jumlahHari: finalJumlahHari,
          alasan: alasan.trim()
        });
        setShowSuccessModal(true);
        refreshUser();

        // 2-in-1 Feature: Auto redirect to WhatsApp if pengawas WA exists
        if (pWa && pWa !== '-') {
          let phone = pWa.replace(/[^0-9]/g, '');
          if (phone.startsWith('0')) {
            phone = '62' + phone.substring(1);
          }
          const hour = new Date().getHours();
          let greeting = 'pagi';
          if (hour >= 11 && hour < 15) greeting = 'siang';
          else if (hour >= 15 && hour < 18) greeting = 'sore';
          else if (hour >= 18) greeting = 'malam';

          const formatTgl = (tgl) => format(new Date(tgl), 'dd MMM yyyy', { locale: id });
          const template = `Assalamu'alaikum / Selamat ${greeting}, Bapak/Ibu ${pName || 'Atasan'}.
Mohon maaf mengganggu waktunya.

Saya memohon izin untuk menginformasikan pengajuan cuti saya melalui SiPeCut. Berikut ringkasannya:

▫️ *Kode:* ${res.data.data.kode}
▫️ *Cuti:* ${jenisCuti.replace(/_/g, ' ').toUpperCase()} (${finalJumlahHari} hari)
▫️ *Tanggal:* ${formatTgl(tanggalMulai)} s.d. ${formatTgl(tanggalSelesai)}
▫️ *Keperluan:* ${alasan.trim()}

Mohon perkenan Bapak/Ibu untuk meninjaunya di aplikasi. Terima kasih banyak atas waktunya. 🙏`;

          const text = encodeURIComponent(template);
          window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
        }
      } else {
        showToast(res.data.message, 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan pengajuan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWA = () => {
    if (!successData?.pengawasWa || successData.pengawasWa === '-') {
      showToast('Nomor WA pengawas tidak tersedia', 'error');
      return;
    }
    let phone = successData.pengawasWa.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }

    const hour = new Date().getHours();
    let greeting = 'pagi';
    if (hour >= 11 && hour < 15) greeting = 'siang';
    else if (hour >= 15 && hour < 18) greeting = 'sore';
    else if (hour >= 18) greeting = 'malam';

    const formatTgl = (tgl) => format(new Date(tgl), 'dd MMM yyyy', { locale: id });
    const template = `Assalamu'alaikum / Selamat ${greeting}, Bapak/Ibu ${successData.pengawasName || 'Atasan'}.
Mohon maaf mengganggu waktunya.

Saya memohon izin untuk menginformasikan pengajuan cuti saya melalui SiPeCut. Berikut ringkasannya:

▫️ *Kode:* ${successData.kode}
▫️ *Cuti:* ${successData.jenisCuti.replace(/_/g, ' ').toUpperCase()} (${successData.jumlahHari} hari)
▫️ *Tanggal:* ${formatTgl(successData.tanggalMulai)} s.d. ${formatTgl(successData.tanggalSelesai)}
▫️ *Keperluan:* ${successData.alasan}

Mohon perkenan Bapak/Ibu untuk meninjaunya di aplikasi. Terima kasih banyak atas waktunya. 🙏`;

    const text = encodeURIComponent(template);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Pengajuan Cuti Baru</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Isi detail permohonan cuti untuk diproses atasan</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Jenis Cuti */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-700">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500 dark:text-slate-400" /> Jenis Cuti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {JENIS_CUTI.map(j => {
                const Icon = j.icon;
                const isSelected = jenisCuti === j.id;
                const isDisabled = j.id === 'tahunan' && user.sisaCuti === 0;
                return (
                  <button
                    key={j.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setJenisCuti(j.id)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border-[1.5px] text-left transition-all duration-300 ${
                      isDisabled 
                        ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-50 cursor-not-allowed'
                        : isSelected 
                          ? 'border-blue-500/50 bg-blue-50 dark:bg-blue-900/30/50 shadow-[0_4px_14px_0_rgb(79,70,229,0.1)] ring-1 ring-blue-500/20 translate-y-[-2px]' 
                          : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 hover:border-blue-300/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 transition-colors duration-300 ${isSelected ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[14px] font-bold tracking-tight break-words transition-colors duration-300 ${isSelected ? 'text-blue-950' : 'text-slate-700 dark:text-slate-300'}`}>{j.label}</div>
                      <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{j.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tanggal */}
        <Card>
          <CardHeader className="border-b-[1.5px] border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
              <Calendar className="h-4 w-4 text-blue-500" /> Jadwal Cuti
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="flex flex-col gap-3 w-full">
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">Pilih Rentang Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:bg-slate-800",
                      !date && "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "dd LLL yyyy", { locale: id })} -{" "}
                          {format(date.to, "dd LLL yyyy", { locale: id })}
                        </>
                      ) : (
                        format(date.from, "dd LLL yyyy", { locale: id })
                      )
                    ) : (
                      <span>Pilih tanggal mulai dan selesai</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    locale={id}
                    disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            {finalJumlahHari > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                <div className={`flex items-center justify-between rounded-xl border p-5 shadow-inner ${
                  jenisCuti === 'tahunan' && finalJumlahHari > user.sisaCuti 
                    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' 
                    : 'bg-blue-50 dark:bg-blue-900/40 border-blue-100 dark:border-blue-800/50'
                }`}>
                  <span className={`text-[13px] font-medium ${
                    jenisCuti === 'tahunan' && finalJumlahHari > user.sisaCuti 
                      ? 'text-rose-900 dark:text-rose-200' 
                      : 'text-blue-900 dark:text-blue-200'
                  }`}>Total pengajuan</span>
                  <span className={`text-xl font-bold ${
                    jenisCuti === 'tahunan' && finalJumlahHari > user.sisaCuti 
                      ? 'text-rose-700 dark:text-rose-400' 
                      : 'text-blue-700 dark:text-blue-300'
                  }`}>{finalJumlahHari} <span className="text-[13px] font-semibold opacity-80">hari</span></span>
                </div>
                {jenisCuti === 'tahunan' && finalJumlahHari > user.sisaCuti && (
                  <p className="text-[12px] font-medium text-rose-600 dark:text-rose-400">
                    ⚠ Sisa cuti tahunan Anda ({user.sisaCuti} hari) tidak mencukupi untuk pengajuan ini.
                  </p>
                )}
              </div>
            )}

            {(includesSabtu || includesMinggu) && (jenisCuti === 'tahunan' || jenisCuti === 'alasan_penting') && (
              <div className={`flex flex-col gap-1 p-4 rounded-xl border mt-2 ${
                (includesSabtu && user.sisaCutiSabtu <= 0) || (includesMinggu && user.sisaCutiMinggu <= 0)
                  ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}>
                <span className={`text-[13px] font-semibold ${
                  (includesSabtu && user.sisaCutiSabtu <= 0) || (includesMinggu && user.sisaCutiMinggu <= 0)
                    ? 'text-rose-800 dark:text-rose-200'
                    : 'text-amber-800 dark:text-amber-200'
                }`}>Cuti Melewati Akhir Pekan</span>
                <span className={`text-[12px] ${
                  (includesSabtu && user.sisaCutiSabtu <= 0) || (includesMinggu && user.sisaCutiMinggu <= 0)
                    ? 'text-rose-600 dark:text-rose-300'
                    : 'text-amber-700 dark:text-amber-300'
                }`}>
                  Pengajuan ini mencakup hari libur akhir pekan.
                  {includesSabtu && ` Sisa ijin Sabtu: ${user.sisaCutiSabtu}x.`}
                  {includesMinggu && ` Sisa ijin Minggu: ${user.sisaCutiMinggu}x.`}
                </span>
                {((includesSabtu && user.sisaCutiSabtu <= 0) || (includesMinggu && user.sisaCutiMinggu <= 0)) && (
                   <span className="text-[12px] font-medium text-rose-600 dark:text-rose-400 mt-1">
                     ⚠ Jatah ijin akhir pekan Anda sudah habis. Silakan sesuaikan tanggal pengajuan.
                   </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Keterangan & Pengganti */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Card>
            <CardHeader className="border-b-[1.5px] border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                <ClipboardList className="h-4 w-4 text-blue-500" /> Keterangan
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <Textarea 
                placeholder="Tuliskan alasan pengajuan cuti..."
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                required
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b-[1.5px] border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200">
                <User className="h-4 w-4 text-blue-500" /> Pelaksana Tugas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <Input 
                type="text" 
                placeholder="Nama pegawai pengganti (opsional)"
                value={penggantiTugas}
                onChange={(e) => setPenggantiTugas(e.target.value)}
              />
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                Rekan yang akan menerima pelimpahan tugas selama Anda tidak di tempat.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Submit */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => onNavigate('dashboard')} className="sm:w-auto">
            Batal
          </Button>
          <Button type="submit" disabled={submitting} className="sm:w-auto">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : <><Send className="h-4 w-4" /> Kirim Pengajuan</>}
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="pt-8 pb-6 px-6 text-center space-y-5">
              <div className="mx-auto w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pengajuan Berhasil</h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2">
                  Cuti Anda telah disimpan dan menunggu tinjauan dari pengawas.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                {successData?.pengawasWa && successData.pengawasWa !== '-' && (
                  <Button onClick={handleWA} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
                    <Send className="w-4 h-4 mr-2" /> Kabari Pengawas via WA
                  </Button>
                )}
                <Button variant="outline" onClick={() => onNavigate('riwayat')} className="w-full">
                  Lihat Riwayat Pengajuan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
