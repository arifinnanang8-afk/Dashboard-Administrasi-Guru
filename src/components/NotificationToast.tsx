import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notification } = useApp();

  if (!notification) return null;

  const bgColors = {
    success: 'bg-emerald-900/90 text-white border-emerald-500',
    error: 'bg-rose-900/90 text-white border-rose-500',
    info: 'bg-slate-900/90 text-white border-cyan-500',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up no-print">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md max-w-md ${
          bgColors[notification.type]
        }`}
      >
        {icons[notification.type]}
        <p className="text-sm font-medium leading-relaxed">{notification.message}</p>
      </div>
    </div>
  );
};
