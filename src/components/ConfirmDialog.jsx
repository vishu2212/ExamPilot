import React from 'react';

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div
            className={`rounded-xl p-2.5 shrink-0 ${
              isDestructive ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
            <p className="mt-1.5 text-xs text-[#475569] leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto rounded-xl border border-[#E7E3DC] bg-white px-4 py-2.5 sm:py-2 text-xs font-semibold text-[#475569] hover:bg-slate-50 transition-colors text-center touch-manipulation"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:w-auto rounded-xl px-4 py-2.5 sm:py-2 text-xs font-semibold text-white shadow-xs transition-colors text-center touch-manipulation ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#4F46E5] hover:bg-[#4338CA]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
