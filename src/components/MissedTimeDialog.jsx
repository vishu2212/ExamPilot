import React, { useState } from 'react';
import { validateMissed } from '../lib/validation.js';
import { formatHours } from '../lib/units.js';

export function MissedTimeDialog({
  isOpen,
  todayFreeUnits,
  todayIndex,
  onConfirm,
  onClose
}) {
  const [hoursInput, setHoursInput] = useState('1.0');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const maxHours = todayFreeUnits / 2;

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateMissed(hoursInput, todayFreeUnits);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    onConfirm(result.units);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700 shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0F172A]">Record Missed Study Time</h3>
              <p className="text-xs text-[#475569]">Day {todayIndex + 1} · Adaptive Recovery</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 touch-manipulation"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-3 text-xs sm:text-sm text-[#475569] leading-relaxed">
          Life happens. Tell ExamPilot how much study time you lost today. We will recalculate your
          remaining schedule across genuinely available future days without exceeding daily capacity limits.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A]">
              Missed Hours Today
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="0.5"
                max={maxHours}
                value={hoursInput}
                onChange={(e) => {
                  setHoursInput(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-xl border border-[#E7E3DC] px-3.5 py-2.5 sm:py-2 text-base sm:text-sm text-[#0F172A] focus:border-[#4F46E5] focus:outline-hidden focus:ring-1 focus:ring-[#4F46E5]"
                placeholder="e.g. 1.5"
                autoFocus
              />
              <span className="text-xs font-medium text-[#475569]">hours</span>
            </div>
            <p className="mt-1 text-xs text-[#475569]">
              Maximum available to miss today: <span className="font-semibold">{formatHours(todayFreeUnits)}</span>
            </p>
            {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl border border-[#E7E3DC] bg-white px-4 py-2.5 sm:py-2 text-xs font-semibold text-[#475569] hover:bg-slate-50 text-center touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={todayFreeUnits <= 0}
              className="w-full sm:w-auto rounded-xl bg-[#4F46E5] px-4 py-2.5 sm:py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50 text-center touch-manipulation"
            >
              Recalculate Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
