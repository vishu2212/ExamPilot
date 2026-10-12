import React from 'react';
import { formatHours } from '../lib/units.js';
import { priority, rankTopics } from '../lib/scheduler.js';

export function TopicProgressList({ topics, derived, onToggleMastered }) {
  if (!topics || !derived) return null;

  const ranked = rankTopics(topics);

  return (
    <div className="rounded-2xl border border-[#E7E3DC] bg-white p-5 shadow-xs">
      <h3 className="text-sm font-semibold tracking-tight text-[#0F172A]">
        Topic Coverage & Priorities
      </h3>
      <p className="mt-0.5 text-xs text-[#475569]">
        Allocations ordered by Priority = Importance × (6 − Confidence)
      </p>

      <div className="mt-4 space-y-3.5">
        {ranked.map((topic) => {
          const comp = derived.completedByTopic[topic.id] || 0;
          const unalloc = derived.unallocatedByTopic[topic.id] || 0;
          const isAtRisk = derived.atRiskByTopic[topic.id];
          const isMastered = topic.mastered;
          const priScore = priority(topic);

          const percent = topic.estimatedUnits > 0
            ? Math.min(100, (comp / topic.estimatedUnits) * 100)
            : 0;

          return (
            <div key={topic.id} className="rounded-xl border border-[#E7E3DC] bg-[#FAF8F4]/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#0F172A]">{topic.name}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                      priScore >= 12
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : priScore >= 6
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    P{priScore}
                  </span>
                  {isMastered && (
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      Mastered
                    </span>
                  )}
                  {isAtRisk && (
                    <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                      -{formatHours(unalloc)} at risk
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-[#475569]">
                    {formatHours(comp)} / {formatHours(topic.estimatedUnits)}
                  </span>
                  {onToggleMastered && (
                    <button
                      type="button"
                      onClick={() => onToggleMastered(topic.id)}
                      className={`text-[11px] font-medium transition-colors hover:underline ${
                        isMastered ? 'text-[#475569]' : 'text-[#4F46E5]'
                      }`}
                    >
                      {isMastered ? 'Undo' : 'Mastered'}
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className={`h-full transition-all duration-300 ${
                    isMastered || percent >= 100 ? 'bg-emerald-600' : 'bg-[#4F46E5]'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
