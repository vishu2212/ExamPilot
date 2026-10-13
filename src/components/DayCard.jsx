import React from 'react';
import { StudyBlock } from './StudyBlock.jsx';
import { formatHours } from '../lib/units.js';
import { addDays, formatDayLabel } from '../lib/dates.js';

export function DayCard({
  dayIndex,
  planStartDate,
  blocks,
  topicsById,
  dailyUnits,
  missedUnits = 0,
  reviewBufferUnits = 0,
  isToday = false,
  isPast = false,
  onToggleBlock
}) {
  const dateStr = addDays(planStartDate, dayIndex);
  const formattedDate = formatDayLabel(dateStr);

  const completedUnits = blocks
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.units, 0);

  const plannedUnits = blocks
    .filter((b) => b.status === 'planned')
    .reduce((sum, b) => sum + b.units, 0);

  const usedUnits = completedUnits + plannedUnits + missedUnits;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
        isToday
          ? 'border-indigo-300 bg-white ring-2 ring-indigo-100'
          : isPast
            ? 'border-[#E7E3DC] bg-slate-50/70 opacity-80'
            : 'border-[#E7E3DC] bg-white'
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="font-semibold text-[#0F172A]">Day {dayIndex + 1}</span>
          <span className="text-xs text-[#475569]">· {formattedDate}</span>
          {isToday && (
            <span className="rounded-full bg-[#4F46E5] px-2 py-0.5 text-[11px] font-medium text-white">
              Today
            </span>
          )}
          {isPast && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              Past
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {missedUnits > 0 && (
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-rose-700 border border-rose-200">
              {formatHours(missedUnits)} missed
            </span>
          )}
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-[#475569]">
            {formatHours(usedUnits)} / {formatHours(dailyUnits)}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {blocks.length === 0 && reviewBufferUnits === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-[#475569]">
            No study blocks scheduled for this day
          </p>
        )}

        {blocks.map((block) => (
          <StudyBlock
            key={block.id}
            block={block}
            topic={topicsById[block.topicId]}
            onToggle={onToggleBlock}
            isPast={isPast}
          />
        ))}

        {reviewBufferUnits > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-3 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Review Buffer / Free Study Time</span>
            </div>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 font-semibold tabular-nums text-emerald-800">
              {formatHours(reviewBufferUnits)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
