import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, RefreshCw } from 'lucide-react';

export const SyncStatusIndicator: React.FC = () => {
  const { schoolProfile, runMasterSync } = useApp();
  
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      <span>Pipeline Aktif: {schoolProfile.subject} ({schoolProfile.grade})</span>
      <button 
        onClick={runMasterSync}
        className="ml-2 p-1 rounded-full hover:bg-emerald-100 transition-colors"
        title="Sinkronisasi ulang semua modul"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
