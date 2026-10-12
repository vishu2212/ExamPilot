import React from 'react';

export function Footer({ hasPlan, onReset }) {
  return (
    <footer className="mt-12 border-t border-[#E7E3DC] bg-[#FFFFFF] px-6 py-6 text-xs text-[#475569]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div>
          <span>ExamPilot · Devpost Learn Hackathon PoC</span>
          <span className="mx-2 text-slate-300">|</span>
          <span>Data stored locally in browser (no external APIs)</span>
        </div>
        {hasPlan && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline"
          >
            Reset Plan & Data
          </button>
        )}
      </div>
    </footer>
  );
}
