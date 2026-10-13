import React, { useState, useEffect, useReducer } from 'react';
import { Header } from './components/Header.jsx';
import { ExamSetupForm } from './components/ExamSetupForm.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { ScheduleView } from './components/ScheduleView.jsx';
import { TopicProgressList } from './components/TopicProgressList.jsx';
import { MissedTimeDialog } from './components/MissedTimeDialog.jsx';
import { ConfirmDialog } from './components/ConfirmDialog.jsx';
import { CompletionCard } from './components/CompletionCard.jsx';
import { Footer } from './components/Footer.jsx';
import { today, daysBetween } from './lib/dates.js';
import { derive } from './lib/scheduler.js';
import { buildSampleSetup } from './lib/sampleExam.js';
import { planReducer } from './state/planReducer.js';
import { load, save, clear } from './lib/storage.js';

export default function App() {
  const [todayDateStr] = useState(() => today());
  const [planState, dispatch] = useReducer(planReducer, null);
  const [formKey, setFormKey] = useState(0);
  const [initialFormValues, setInitialFormValues] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isMissedModalOpen, setIsMissedModalOpen] = useState(false);

  // Storage notice
  const [storageNotice, setStorageNotice] = useState(null);

  // Confirmation dialog state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    isDestructive: false,
    onConfirm: null
  });

  // 1. Initial Load from localStorage on mount
  useEffect(() => {
    const { state: savedState, notice } = load();
    if (notice) {
      setStorageNotice(notice);
    }
    if (savedState) {
      // Check if today moved ahead since last save
      const currentTodayIndex = Math.max(0, daysBetween(savedState.exam.planStartDate, todayDateStr));
      if (currentTodayIndex > (savedState.lastScheduledDayIndex ?? 0)) {
        // Automatically dispatch DAY_ADVANCED so uncompleted past work reschedules
        dispatch({
          type: 'DAY_ADVANCED',
          payload: { todayIndex: currentTodayIndex }
        });
      } else {
        dispatch({ type: 'HYDRATE', payload: savedState });
      }
    }
  }, [todayDateStr]);

  // 2. Persist to localStorage on state changes
  useEffect(() => {
    if (planState) {
      save(planState);
    }
  }, [planState]);

  // Derived calculations
  const todayIndex = planState
    ? Math.max(0, daysBetween(planState.exam.planStartDate, todayDateStr))
    : 0;

  const derived = planState ? derive(planState, todayIndex) : null;

  const daysUntilExam = planState
    ? Math.max(0, daysBetween(todayDateStr, planState.exam.examDate))
    : 0;

  const isAllWorkCompleted = Boolean(
    derived &&
    derived.totalRemainingUnits === 0 &&
    (derived.totalCompletedUnits > 0 || planState?.topics.some((t) => t.mastered))
  );

  const handleLoadSample = () => {
    const sampleSetup = buildSampleSetup(todayDateStr);
    dispatch({
      type: 'GENERATE',
      payload: { setup: sampleSetup, today: todayDateStr }
    });
    setInitialFormValues(sampleSetup);
    setShowEditForm(false);
  };

  const handleGenerate = (formData) => {
    // If we already have a plan running, prompt for confirmation
    if (planState) {
      setConfirmModal({
        isOpen: true,
        title: 'Reset Current Plan Progress?',
        message: 'Updating your exam setup will create a fresh study schedule and reset all current progress, completed sessions, and missed hours. Do you want to proceed?',
        confirmLabel: 'Reset & Generate',
        isDestructive: true,
        onConfirm: () => {
          dispatch({
            type: 'GENERATE',
            payload: { setup: formData, today: todayDateStr }
          });
          setShowEditForm(false);
          setConfirmModal((m) => ({ ...m, isOpen: false }));
        }
      });
      return;
    }

    dispatch({
      type: 'GENERATE',
      payload: { setup: formData, today: todayDateStr }
    });
    setShowEditForm(false);
  };

  const handleResetRequest = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Study Plan?',
      message: 'Are you sure you want to reset your exam plan? All schedule progress, checked blocks, and recorded missed time will be cleared from your browser.',
      confirmLabel: 'Reset Everything',
      isDestructive: true,
      onConfirm: () => {
        clear();
        dispatch({ type: 'RESET' });
        setInitialFormValues(null);
        setShowEditForm(false);
        setFormKey((k) => k + 1);
        setConfirmModal((m) => ({ ...m, isOpen: false }));
      }
    });
  };

  const handleToggleBlock = (blockId) => {
    dispatch({
      type: 'TOGGLE_BLOCK',
      payload: { blockId, todayIndex }
    });
  };

  const handleToggleMastered = (topicId) => {
    const target = planState.topics.find((t) => t.id === topicId);
    if (!target) return;
    if (target.mastered) {
      dispatch({
        type: 'UNMASTER',
        payload: { topicId, todayIndex }
      });
    } else {
      dispatch({
        type: 'MARK_MASTERED',
        payload: { topicId, todayIndex }
      });
    }
  };

  const handleConfirmMissed = (units) => {
    dispatch({
      type: 'REPORT_MISSED',
      payload: { units, todayIndex }
    });
  };

  const handleDismissChange = () => {
    dispatch({ type: 'DISMISS_CHANGE' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F4]">
      <Header
        exam={planState ? planState.exam : null}
        progressPercent={derived ? derived.progressPercent : 0}
        daysUntilExam={daysUntilExam}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-3.5 py-5 sm:px-6 sm:py-8">
        {/* Safe recovery notice if localStorage data was invalid or corrupted */}
        {storageNotice && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-medium text-amber-900 shadow-xs">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{storageNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setStorageNotice(null)}
              className="text-amber-700 hover:text-amber-950 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {!planState ? (
          /* Empty / Initial State */
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <ExamSetupForm
                key={formKey}
                initialValues={initialFormValues}
                todayDateStr={todayDateStr}
                onGenerate={handleGenerate}
                onLoadSample={handleLoadSample}
              />
            </div>
            <div className="lg:col-span-7">
              <EmptyState onLoadSample={handleLoadSample} />
            </div>
          </div>
        ) : (
          /* Active Schedule State */
          <div className="space-y-6">
            {/* Completion card if all required effort is done/mastered */}
            {isAllWorkCompleted && (
              <CompletionCard
                exam={planState.exam}
                topics={planState.topics}
                derived={derived}
                onReset={handleResetRequest}
              />
            )}

            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12">
              {/* Left Column: Topics overview and Setup editor */}
              <div className="space-y-6 lg:col-span-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7E3DC] bg-white p-4 shadow-xs">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A]">{planState.exam.subject}</h3>
                    <p className="text-xs text-[#475569]">
                      Exam date: {planState.exam.examDate} · {planState.exam.dailyUnits / 2}h daily
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditForm((prev) => !prev)}
                    className="rounded-lg border border-[#E7E3DC] bg-[#FAF8F4] px-3 py-1.5 sm:px-2.5 sm:py-1 text-xs font-medium text-[#475569] hover:bg-slate-100 min-h-[36px] flex items-center touch-manipulation"
                  >
                    {showEditForm ? 'Hide Setup' : 'Edit Setup'}
                  </button>
                </div>

                {showEditForm ? (
                  <ExamSetupForm
                    key={`edit-${formKey}`}
                    initialValues={{
                      subject: planState.exam.subject,
                      examDate: planState.exam.examDate,
                      dailyHours: planState.exam.dailyUnits / 2,
                      topics: planState.topics.map((t) => ({
                        name: t.name,
                        confidence: t.confidence,
                        importance: t.importance,
                        estimatedHours: t.estimatedHours
                      }))
                    }}
                    todayDateStr={todayDateStr}
                    onGenerate={handleGenerate}
                    onLoadSample={handleLoadSample}
                    isEditing={true}
                    onCancelEdit={() => setShowEditForm(false)}
                  />
                ) : (
                  <TopicProgressList
                    topics={planState.topics}
                    derived={derived}
                    onToggleMastered={handleToggleMastered}
                  />
                )}
              </div>

              {/* Right Column: Daily schedule */}
              <div className="lg:col-span-7">
                <ScheduleView
                  planState={planState}
                  derived={derived}
                  todayIndex={todayIndex}
                  onOpenMissedModal={() => setIsMissedModalOpen(true)}
                  onToggleBlock={handleToggleBlock}
                  onDismissChange={handleDismissChange}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Missed Time Recovery Dialog */}
      {planState && derived && (
        <MissedTimeDialog
          isOpen={isMissedModalOpen}
          todayFreeUnits={derived.dayCapacities[todayIndex] || 0}
          todayIndex={todayIndex}
          onConfirm={handleConfirmMissed}
          onClose={() => setIsMissedModalOpen(false)}
        />
      )}

      {/* Reset & Edit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((m) => ({ ...m, isOpen: false }))}
      />

      <Footer hasPlan={Boolean(planState)} onReset={handleResetRequest} />
    </div>
  );
}
