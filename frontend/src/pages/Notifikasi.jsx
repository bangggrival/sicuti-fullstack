import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Bell, CheckCircle2, XCircle, AlertCircle, BellOff, Loader2 } from 'lucide-react';

export default function Notifikasi({ showToast }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchNotifs(); 
    const handleRefresh = () => fetchNotifs(true);
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  const fetchNotifs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/notifikasi');
      if (res.data.success) setNotifs(res.data.data);
    } catch (err) {
      console.error('Error fetching notifications', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifikasi/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      showToast('Semua notifikasi ditandai dibaca', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const iconMap = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    error: <XCircle className="h-4 w-4 text-red-600" />,
    info: <AlertCircle className="h-4 w-4 text-blue-600" />,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Notifikasi</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">Pemberitahuan perubahan status pengajuan</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Tandai Semua Dibaca
        </Button>
      </div>

      {/* Notifications */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat notifikasi...
            </div>
          ) : notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
              <BellOff className="h-10 w-10 stroke-[1.5] mb-3" />
              <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">Belum ada notifikasi</p>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Pemberitahuan baru akan muncul di sini</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifs.map(n => (
                <div 
                  key={n.id} 
                  className={`flex items-start gap-3.5 px-5 py-4 transition-colors ${
                    !n.read ? 'bg-blue-50 dark:bg-blue-900/30/40' : ''
                  }`}
                >
                  <div className="shrink-0 mt-0.5">{iconMap[n.type] || iconMap.info}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">{n.message}</p>
                    <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(n.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  {!n.read && <div className="h-2 w-2 rounded-full bg-blue-50 dark:bg-blue-900/300 shrink-0 mt-2" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
