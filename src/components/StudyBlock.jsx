import React from 'react';
import { formatHours } from '../lib/units.js';
import { priority } from '../lib/scheduler.js';

export function StudyBlock({ block, topic, onToggle, isPast = false }) {
  if (!topic) return null;

  const priScore = priority(topic);
  const isCompleted = block.status === 'completed';

  return (
    <div
      className={`group flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
        isCompleted
          ? 'border-emerald-200 bg-emerald-50/50 text-[#475569]'
          : 'border-[#E7E3DC] bg-[#FFFFFF] hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <label className="relative flex cursor-pointer items-center justify-center min-w-[44px] min-h-[44px] -m-2 p-2 touch-manipulation">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => onToggle && onToggle(block.id)}
            disabled={!onToggle}
            className="h-5 w-5 sm:h-4 sm:w-4 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5] focus:ring-offset-0 disabled:cursor-not-allowed cursor-pointer"
          />
        </label>
        <div>
          <span
            className={`text-sm font-medium ${
              isCompleted ? 'text-emerald-900' : 'text-[#0F172A]'
            }`}
          >
            {topic.name}
          </span>
          <div className="flex items-center gap-2 text-xs text-[#475569]">
            <span className="capitalize">{topic.importance} importance</span>
            <span>·</span>
            <span>Conf. {topic.confidence}/5</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums ${
            isCompleted
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-indigo-50 text-[#4F46E5]'
          }`}
        >
          {formatHours(block.units)}
        </span>
        <span
          className={`hidden sm:inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
            priScore >= 12
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : priScore >= 6
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-slate-100 text-slate-700'
          }`}
        >
          P{priScore}
        </span>
      </div>
    </div>
  );
}
