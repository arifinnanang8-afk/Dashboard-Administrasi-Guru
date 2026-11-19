import React from 'react';

export type KalenderRpeStep = 1 | 2 | 3 | 4;

interface KalenderRpeStepNavProps {
  activeStep: KalenderRpeStep;
  onSelectStep: (step: KalenderRpeStep) => void;
  academicYear?: string;
}

export const KalenderRpeStepNav: React.FC<KalenderRpeStepNavProps> = ({
  activeStep,
  onSelectStep,
}) => {
  const steps: { id: KalenderRpeStep; label: string }[] = [
    { id: 1, label: '1. Identitas & Jadwal Mengajar' },
    { id: 2, label: '2. Kalender Pendidikan' },
    { id: 3, label: '3. Analisis Minggu & Pertemuan Efektif' },
    { id: 4, label: '4. Program Alokasi Waktu (TP)' },
  ];

  return (
    <nav
      aria-label="Tahapan Kalender Pendidikan dan RPE"
      className="bg-white border border-slate-200 rounded-2xl sm:rounded-full p-1.5 shadow-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
        {steps.map((step) => {
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelectStep(step.id)}
              aria-current={isActive ? 'step' : undefined}
              className={`px-4 py-2.5 text-xs sm:text-[13px] leading-snug font-bold text-center transition-all cursor-pointer flex items-center justify-center rounded-xl sm:rounded-2xl ${
                isActive
                  ? 'bg-[#109848] text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {step.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
