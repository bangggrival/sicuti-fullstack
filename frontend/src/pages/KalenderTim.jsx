import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import idLocale from 'date-fns/locale/id';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../api/client';
import { Card, CardContent } from '../components/ui/card';
import { Loader2 } from 'lucide-react';
import '../kalender-custom.css';

const locales = {
  'id': idLocale,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function KalenderTim() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKalender();
    const handleRefresh = () => fetchKalender(true);
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  const fetchKalender = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/pengajuan/kalender');
      if (res.data.success) {
        const formattedEvents = res.data.data.map(p => ({
          id: p.id,
          title: `${p.pegawaiNama} (${p.jenisCuti})`,
          start: new Date(p.tanggalMulai),
          end: new Date(new Date(p.tanggalSelesai).getTime() + 24 * 60 * 60 * 1000), // exclusive end
          status: p.status,
          color: p.pegawaiColor || '#2563EB',
          jenisCuti: p.jenisCuti
        }));
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const eventStyleGetter = (event, start, end, isSelected) => {
    let backgroundColor = event.status === 'disetujui' ? '#10B981' : '#F59E0B';
    
    const style = {
      backgroundColor,
      borderRadius: '6px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block',
      fontWeight: '500',
      fontSize: '12px',
      padding: '2px 6px'
    };
    return { style };
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Kalender Tim</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pantau jadwal cuti seluruh pegawai dalam satu bulan.</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-[13px]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span> Disetujui
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></span> Menunggu / Diketahui
        </div>
      </div>

      <Card className="shadow-sm border-slate-200 dark:border-slate-700">
        <CardContent className="p-0 sm:p-4">
          {loading ? (
            <div className="flex items-center justify-center py-40">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500 dark:text-slate-400" />
            </div>
          ) : (
            <div className="h-[650px] bg-white dark:bg-slate-900 rounded-xl overflow-hidden p-2">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%', fontFamily: 'inherit' }}
                culture="id"
                eventPropGetter={eventStyleGetter}
                views={['month', 'week', 'day', 'agenda']}
                messages={{
                  next: "Maju",
                  previous: "Mundur",
                  today: "Hari Ini",
                  month: "Bulan",
                  week: "Minggu",
                  day: "Hari",
                  agenda: "Agenda",
                  date: "Tanggal",
                  time: "Waktu",
                  event: "Cuti",
                  noEventsInRange: "Tidak ada pengajuan cuti pada rentang waktu ini.",
                  showMore: total => `+${total} lebih`
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
