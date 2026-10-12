import React, { useState } from 'react';
import { Header } from './components/Header.jsx';
import { ExamSetupForm } from './components/ExamSetupForm.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { Footer } from './components/Footer.jsx';
import { today, addDays } from './lib/dates.js';

export default function App() {
  const [todayDateStr] = useState(() => today());
  const [formKey, setFormKey] = useState(0);
  const [initialFormValues, setInitialFormValues] = useState(null);
  const [planState, setPlanState] = useState(null);

  const handleLoadSample = () => {
    const sampleSetup = {
      subject: 'CS 201: Data Structures',
      examDate: addDays(todayDateStr, 4),
      dailyHours: 4,
      topics: [
        { name: 'Trees', confidence: 1, importance: 'high', estimatedHours: 5 },
        { name: 'Graphs', confidence: 2, importance: 'high', estimatedHours: 5 },
        { name: 'Sorting', confidence: 3, importance: 'medium', estimatedHours: 3 },
        { name: 'Arrays', confidence: 4, importance: 'medium', estimatedHours: 2 }
      ]
    };
    setInitialFormValues(sampleSetup);
    setFormKey((k) => k + 1);
  };

  const handleGenerate = (formData) => {
    // Slice 1: Form validation verified; Slice 2 connects this to the scheduler engine
    console.log('Valid exam setup generated:', formData);
    // Display a temporary feedback alert for Slice 1
    alert(`Setup validated successfully for "${formData.subject}". Scheduler engine will generate daily blocks in Slice 2.`);
  };

  const handleReset = () => {
    setPlanState(null);
    setInitialFormValues(null);
    setFormKey((k) => k + 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F4]">
      <Header
        exam={planState ? planState.exam : null}
        progressPercent={0}
        daysUntilExam={4}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Setup form */}
          <div className="lg:col-span-5">
            <ExamSetupForm
              key={formKey}
              initialValues={initialFormValues}
              todayDateStr={todayDateStr}
              onGenerate={handleGenerate}
              onLoadSample={handleLoadSample}
            />
          </div>

          {/* Right Column: Schedule surface */}
          <div className="lg:col-span-7">
            <EmptyState onLoadSample={handleLoadSample} />
          </div>
        </div>
      </main>

      <Footer hasPlan={Boolean(planState)} onReset={handleReset} />
    </div>
  );
}
