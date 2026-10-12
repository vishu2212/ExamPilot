import React from 'react';

export function RecoveryBanner({ lastChange, onDismiss }) {
  if (!lastChange || !lastChange.lines || lastChange.lines.length === 0) return null;

  const { lines, deficitBeforeUnits, deficitAfterUnits } = lastChange;
  const isTriage = deficitAfterUnits > 0;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-xs transition-all ${
        isTriage
          ? 'border-amber-300 bg-amber-50/70 text-amber-950'
          : 'border-indigo-200 bg-indigo-50/70 text-indigo-950'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div
            className={`mt-0.5 rounded-lg p-1.5 ${
              isTriage ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-[#4F46E5]'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              {isTriage ? 'Schedule Adjusted · Work Shifted to Future Days' : 'Schedule Adjusted'}
            </h3>
            <p className="mt-0.5 text-xs opacity-85">
              ExamPilot recomputed your remaining study allocations based on real capacity:
            </p>

            <ul className="mt-2.5 space-y-1 text-xs">
              {lines.map((line, index) => (
                <li key={index} className="flex items-baseline gap-2">
                  <span className="text-slate-400">▪</span>
                  <span className="font-medium">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600"
            title="Dismiss notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
