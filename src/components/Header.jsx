import React from 'react';

export function Header({ exam, progressPercent, daysUntilExam }) {
  return (
    <header className="border-b border-[#E7E3DC] bg-[#FFFFFF] px-6 py-4 shadow-xs">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5] text-white shadow-xs">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-[#0F172A]">ExamPilot</h1>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-[#4F46E5]">
                PoC
              </span>
            </div>
            <p className="text-xs text-[#475569]">Adaptive exam preparation & recovery planner</p>
          </div>
        </div>

        {exam ? (
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[#0F172A]">{exam.subject}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-[#475569]">
                {daysUntilExam === 0
                  ? 'Exam Day'
                  : daysUntilExam === 1
                    ? '1 day until exam'
                    : `${daysUntilExam} days until exam`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-36 overflow-hidden rounded-full bg-slate-100 sm:w-48">
                <div
                  className="h-full bg-[#4F46E5] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent || 0))}%` }}
                />
              </div>
              <span className="text-xs font-medium text-[#475569] tabular-nums">
                {Math.round(progressPercent || 0)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-[#475569]">
            Plan first · Triage intelligently · Recover gracefully
          </div>
        )}
      </div>
    </header>
  );
}
