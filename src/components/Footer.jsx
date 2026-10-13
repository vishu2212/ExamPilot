import React from 'react';

export function Footer({ hasPlan, onReset }) {
  return (
    <footer className="mt-12 border-t border-[#E7E3DC] bg-[#FFFFFF] px-4 py-6 sm:px-6 text-xs text-[#475569]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
          <span>ExamPilot · Devpost Learn Hackathon PoC</span>
          <span className="hidden sm:inline mx-1.5 text-slate-300">|</span>
          <span className="text-[11px] sm:text-xs">Data stored locally in browser (no external APIs)</span>
        </div>
        {hasPlan && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline py-1.5 px-2.5 min-h-[36px] flex items-center touch-manipulation"
          >
            Reset Plan & Data
          </button>
        )}
      </div>
    </footer>
  );
}
