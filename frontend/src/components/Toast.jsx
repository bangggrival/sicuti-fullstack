import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => onClose(), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const styles = {
    success: { bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300', icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> },
    error: { bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300', icon: <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" /> },
    info: { bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300', icon: <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" /> },
  };

  const s = styles[toast.type] || styles.info;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div className={`pointer-events-auto flex items-center gap-3 rounded-2xl px-5 py-4 text-[13px] font-bold bg-white dark:bg-slate-900 border shadow-md ${s.bg}`}>
        {s.icon}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
