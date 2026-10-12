import React from 'react';
import { FeasibilityBanner } from './FeasibilityBanner.jsx';
import { RecoveryBanner } from './RecoveryBanner.jsx';
import { DayCard } from './DayCard.jsx';
import { daysBetween } from '../lib/dates.js';

export function ScheduleView({
  planState,
  derived,
  todayIndex = 0,
  onOpenMissedModal,
  onToggleBlock,
  onDismissChange
}) {
  if (!planState || !derived) return null;

  const { exam, topics, blocks, missedUnitsByDay, lastChange } = planState;
  const numDays = daysBetween(exam.planStartDate, exam.examDate);

  const topicsById = {};
  topics.forEach((t) => {
    topicsById[t.id] = t;
  });

  // Group blocks by dayIndex
  const blocksByDay = {};
  for (let d = 0; d < numDays; d++) {
    blocksByDay[d] = [];
  }
  blocks.forEach((b) => {
    if (blocksByDay[b.dayIndex]) {
      blocksByDay[b.dayIndex].push(b);
    }
  });

  const todayFreeUnits = derived.dayCapacities[todayIndex] || 0;

  return (
    <div className="space-y-6">
      {/* Recovery diff banner (shown if schedule was recalculated via recovery) */}
      {lastChange && (
        <RecoveryBanner lastChange={lastChange} onDismiss={onDismissChange} />
      )}

      {/* Feasibility / Triage notification */}
      <FeasibilityBanner derived={derived} topics={topics} />

      {/* Schedule Header with Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
            Daily Study Schedule
          </h2>
          <p className="text-xs text-[#475569]">
            {numDays} day preparation window · Capacity-constrained daily sessions
          </p>
        </div>

        {onOpenMissedModal && (
          <button
            type="button"
            onClick={onOpenMissedModal}
            disabled={todayFreeUnits <= 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-xs transition-colors hover:bg-rose-100 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
            title={todayFreeUnits <= 0 ? 'No study hours left to miss today' : 'Report missed study time'}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            I fell behind / Missed hours
          </button>
        )}
      </div>

      {/* List of Day Cards */}
      <div className="space-y-4">
        {Array.from({ length: numDays }, (_, d) => (
          <DayCard
            key={d}
            dayIndex={d}
            planStartDate={exam.planStartDate}
            blocks={blocksByDay[d] || []}
            topicsById={topicsById}
            dailyUnits={exam.dailyUnits}
            missedUnits={missedUnitsByDay[String(d)] || missedUnitsByDay[d] || 0}
            reviewBufferUnits={derived.reviewBuffers[d] || 0}
            isToday={d === todayIndex}
            isPast={d < todayIndex}
            onToggleBlock={onToggleBlock}
          />
        ))}
      </div>
    </div>
  );
}
