import React from 'react';

export function EmptyState({ onLoadSample }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E7E3DC] bg-white/60 p-8 text-center sm:p-12">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#4F46E5]">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
        No active study plan
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#475569]">
        Configure your upcoming exam parameters on the left, or load the preconfigured
        sample exam to explore the adaptive study schedule immediately.
      </p>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onLoadSample}
          className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Load Sample Exam (CS 201)
        </button>
      </div>
    </div>
  );
}
