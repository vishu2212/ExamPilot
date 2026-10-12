import React, { useState, useReducer } from 'react';
import { Header } from './components/Header.jsx';
import { ExamSetupForm } from './components/ExamSetupForm.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { ScheduleView } from './components/ScheduleView.jsx';
import { TopicProgressList } from './components/TopicProgressList.jsx';
import { MissedTimeDialog } from './components/MissedTimeDialog.jsx';
import { Footer } from './components/Footer.jsx';
import { today, daysBetween } from './lib/dates.js';
import { derive } from './lib/scheduler.js';
import { buildSampleSetup } from './lib/sampleExam.js';
import { planReducer } from './state/planReducer.js';

export default function App() {
  const [todayDateStr] = useState(() => today());
  const [planState, dispatch] = useReducer(planReducer, null);
  const [formKey, setFormKey] = useState(0);
  const [initialFormValues, setInitialFormValues] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isMissedModalOpen, setIsMissedModalOpen] = useState(false);

  // Derived calculations
  const todayIndex = planState
    ? Math.max(0, daysBetween(planState.exam.planStartDate, todayDateStr))
    : 0;

  const derived = planState ? derive(planState, todayIndex) : null;

  const daysUntilExam = planState
    ? Math.max(0, daysBetween(todayDateStr, planState.exam.examDate))
    : 0;

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
    dispatch({
      type: 'GENERATE',
      payload: { setup: formData, today: todayDateStr }
    });
    setShowEditForm(false);
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    setInitialFormValues(null);
    setShowEditForm(false);
    setFormKey((k) => k + 1);
  };

  const handleToggleBlock = (blockId) => {
    dispatch({
      type: 'TOGGLE_BLOCK',
      payload: { blockId, todayIndex }
    });
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {!planState ? (
          /* Empty / Initial State */
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
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
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column: Topics overview and Setup editor */}
            <div className="space-y-6 lg:col-span-5">
              <div className="flex items-center justify-between rounded-2xl border border-[#E7E3DC] bg-white p-4 shadow-xs">
                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A]">{planState.exam.subject}</h3>
                  <p className="text-xs text-[#475569]">
                    Exam date: {planState.exam.examDate} · {planState.exam.dailyUnits / 2}h daily
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditForm((prev) => !prev)}
                  className="rounded-lg border border-[#E7E3DC] bg-[#FAF8F4] px-2.5 py-1 text-xs font-medium text-[#475569] hover:bg-slate-100"
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

      <Footer hasPlan={Boolean(planState)} onReset={handleReset} />
    </div>
  );
}
