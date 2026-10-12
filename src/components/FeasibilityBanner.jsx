import React from 'react';
import { formatHours, unitsToHours } from '../lib/units.js';

export function FeasibilityBanner({ derived, topics }) {
  if (!derived) return null;

  const { isTriage, totalDeficitUnits, totalRemainingUnits, totalAvailableFutureUnits, reviewBuffers } = derived;

  const totalBufferUnits = Object.values(reviewBuffers || {}).reduce((sum, u) => sum + u, 0);

  if (!isTriage) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-emerald-950">Plan fits your available time</h3>
            <p className="mt-0.5 text-xs text-emerald-800">
              All {formatHours(totalRemainingUnits)} of estimated study effort fit within your {formatHours(totalAvailableFutureUnits)} of study capacity.
              {totalBufferUnits > 0 && (
                <span className="ml-1 font-medium text-emerald-900">
                  Includes a {formatHours(totalBufferUnits)} review buffer on final days before your exam.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Triage state
  const atRiskTopics = topics.filter((t) => derived.atRiskByTopic[t.id]);

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-amber-950">Triage Mode Active</h3>
            <span className="rounded-md bg-amber-200/80 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-900">
              {formatHours(totalDeficitUnits)} Shortfall
            </span>
          </div>

          <p className="mt-1 text-xs text-amber-900">
            You need <strong className="tabular-nums">{formatHours(totalRemainingUnits)}</strong>, but only have{' '}
            <strong className="tabular-nums">{formatHours(totalAvailableFutureUnits)}</strong> available.
            ExamPilot prioritized your highest-impact, weakest topics while preserving minimum touchpoints.
          </p>

          {atRiskTopics.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-200/80 bg-white/70 p-3">
              <span className="block text-xs font-medium text-amber-900">
                At-risk topics with reduced coverage:
              </span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {atRiskTopics.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs text-rose-800"
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="text-[11px] tabular-nums font-semibold text-rose-900">
                      -{formatHours(derived.unallocatedByTopic[t.id])} clipped
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
