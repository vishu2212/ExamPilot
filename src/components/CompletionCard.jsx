import React from 'react';
import { formatHours } from '../lib/units.js';

export function CompletionCard({ exam, topics, derived, onReset }) {
  if (!derived || derived.totalRemainingUnits > 0) return null;

  return (
    <div className="rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 p-6 shadow-xs">
      <div className="flex items-start gap-3.5">
        <div className="rounded-xl bg-emerald-100 p-3 text-emerald-800">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-emerald-950">
            Study Plan Completed!
          </h3>
          <p className="mt-1 text-xs text-emerald-900 leading-relaxed">
            All topics for <strong className="font-semibold">{exam?.subject}</strong> are completed or mastered ({formatHours(derived.totalCompletedUnits)} logged). You are in great shape for your exam on {exam?.examDate}.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="rounded-full bg-emerald-200/70 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
              100% Complete
            </span>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-medium text-emerald-800 underline hover:text-emerald-950"
              >
                Start fresh plan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
