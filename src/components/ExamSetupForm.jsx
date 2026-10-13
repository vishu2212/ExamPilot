import React, { useState } from 'react';
import { validateSetup } from '../lib/validation.js';

export function ExamSetupForm({
  initialValues,
  todayDateStr,
  onGenerate,
  onLoadSample,
  isEditing = false,
  onCancelEdit
}) {
  const [form, setForm] = useState(
    initialValues || {
      subject: '',
      examDate: '',
      dailyHours: 4,
      topics: [
        { name: '', confidence: 2, importance: 'high', estimatedHours: 4 },
        { name: '', confidence: 3, importance: 'medium', estimatedHours: 3 },
        { name: '', confidence: 4, importance: 'medium', estimatedHours: 2 }
      ]
    }
  );

  const [errors, setErrors] = useState({});

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTopicChange = (index, field, value) => {
    setForm((prev) => {
      const updatedTopics = [...prev.topics];
      updatedTopics[index] = { ...updatedTopics[index], [field]: value };
      return { ...prev, topics: updatedTopics };
    });
    if (errors.topicRows && errors.topicRows[index]) {
      setErrors((prev) => {
        const nextTopicRows = [...(prev.topicRows || [])];
        if (nextTopicRows[index]) {
          nextTopicRows[index] = { ...nextTopicRows[index], [field]: undefined };
        }
        return { ...prev, topicRows: nextTopicRows };
      });
    }
  };

  const handleAddTopic = () => {
    if (form.topics.length >= 6) return;
    setForm((prev) => ({
      ...prev,
      topics: [
        ...prev.topics,
        { name: '', confidence: 3, importance: 'medium', estimatedHours: 2 }
      ]
    }));
  };

  const handleRemoveTopic = (index) => {
    if (form.topics.length <= 3) return;
    setForm((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = validateSetup(form, todayDateStr);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    onGenerate(form);
  };

  return (
    <div className="rounded-2xl border border-[#E7E3DC] bg-[#FFFFFF] p-4 sm:p-6 shadow-xs">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#0F172A]">
            {isEditing ? 'Edit Exam Setup' : 'Configure Exam'}
          </h2>
          <p className="text-xs text-[#475569]">
            Set your target timeline and topics to build an adaptive schedule
          </p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={onLoadSample}
            className="w-full sm:w-auto text-center rounded-lg border border-[#E7E3DC] bg-[#FAF8F4] px-3.5 py-2 sm:px-3 sm:py-1.5 text-xs font-medium text-[#4F46E5] transition-colors hover:bg-indigo-50 touch-manipulation min-h-[36px]"
          >
            Load Sample (CS 201)
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-xs font-medium text-[#0F172A]">
            Subject / Exam Name
          </label>
          <input
            id="subject"
            type="text"
            placeholder="e.g. CS 201: Data Structures"
            value={form.subject}
            onChange={(e) => handleFieldChange('subject', e.target.value)}
            className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] ${
              errors.subject ? 'border-rose-400 bg-rose-50/30' : 'border-[#E7E3DC] bg-[#FFFFFF]'
            }`}
          />
          {errors.subject && <p className="mt-1 text-xs text-rose-600">{errors.subject}</p>}
        </div>

        {/* Date and Daily Hours */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="examDate" className="block text-xs font-medium text-[#0F172A]">
              Exam Date
            </label>
            <input
              id="examDate"
              type="date"
              value={form.examDate}
              onChange={(e) => handleFieldChange('examDate', e.target.value)}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] ${
                errors.examDate ? 'border-rose-400 bg-rose-50/30' : 'border-[#E7E3DC] bg-[#FFFFFF]'
              }`}
            />
            {errors.examDate && <p className="mt-1 text-xs text-rose-600">{errors.examDate}</p>}
          </div>

          <div>
            <label htmlFor="dailyHours" className="block text-xs font-medium text-[#0F172A]">
              Daily Study Capacity (Hours)
            </label>
            <input
              id="dailyHours"
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              value={form.dailyHours}
              onChange={(e) => handleFieldChange('dailyHours', parseFloat(e.target.value) || 0)}
              className={`mt-1.5 w-full rounded-xl border px-3.5 py-2 text-sm tabular-nums text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] ${
                errors.dailyHours ? 'border-rose-400 bg-rose-50/30' : 'border-[#E7E3DC] bg-[#FFFFFF]'
              }`}
            />
            {errors.dailyHours && <p className="mt-1 text-xs text-rose-600">{errors.dailyHours}</p>}
          </div>
        </div>

        {/* Topics Section */}
        <div className="pt-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
              Topics ({form.topics.length}/6)
            </span>
            <button
              type="button"
              onClick={handleAddTopic}
              disabled={form.topics.length >= 6}
              className="text-xs font-medium text-[#4F46E5] hover:underline disabled:opacity-40"
            >
              + Add Topic
            </button>
          </div>
          {errors.topics && <p className="mb-2 text-xs text-rose-600">{errors.topics}</p>}

          <div className="space-y-3">
            {form.topics.map((topic, index) => {
              const rowErr = errors.topicRows && errors.topicRows[index];
              return (
                <div
                  key={index}
                  className="rounded-xl border border-[#E7E3DC] bg-[#FAF8F4]/50 p-3.5 transition-colors focus-within:border-indigo-300"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Topic ${index + 1} name`}
                      value={topic.name}
                      onChange={(e) => handleTopicChange(index, 'name', e.target.value)}
                      className={`flex-1 rounded-lg border px-3 py-2 sm:py-1.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] ${
                        rowErr?.name ? 'border-rose-400 bg-rose-50/30' : 'border-[#E7E3DC] bg-[#FFFFFF]'
                      }`}
                    />
                    {form.topics.length > 3 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(index)}
                        className="rounded-lg p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-[#475569] hover:bg-rose-50 hover:text-rose-600 touch-manipulation"
                        title="Remove topic"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {rowErr?.name && <p className="mt-1 text-xs text-rose-600">{rowErr.name}</p>}

                  {/* Topic Controls: Confidence, Importance, Effort */}
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Confidence */}
                    <div>
                      <span className="block text-[11px] font-medium text-[#475569]">
                        Confidence (1–5)
                      </span>
                      <div className="mt-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => handleTopicChange(index, 'confidence', lvl)}
                            className={`flex-1 rounded-md py-2 sm:py-1 min-h-[36px] sm:min-h-[28px] text-xs font-semibold transition-colors touch-manipulation ${
                              topic.confidence === lvl
                                ? 'bg-[#4F46E5] text-white'
                                : 'bg-white text-[#475569] border border-[#E7E3DC] hover:bg-slate-50'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                      {rowErr?.confidence && (
                        <p className="mt-1 text-xs text-rose-600">{rowErr.confidence}</p>
                      )}
                    </div>

                    {/* Importance */}
                    <div>
                      <label
                        htmlFor={`importance-${index}`}
                        className="block text-[11px] font-medium text-[#475569]"
                      >
                        Importance
                      </label>
                      <select
                        id={`importance-${index}`}
                        value={topic.importance}
                        onChange={(e) => handleTopicChange(index, 'importance', e.target.value)}
                        className="mt-1 w-full rounded-md border border-[#E7E3DC] bg-white px-2.5 py-2 sm:py-1 text-sm sm:text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      {rowErr?.importance && (
                        <p className="mt-1 text-xs text-rose-600">{rowErr.importance}</p>
                      )}
                    </div>

                    {/* Estimated Hours */}
                    <div>
                      <label
                        htmlFor={`estHours-${index}`}
                        className="block text-[11px] font-medium text-[#475569]"
                      >
                        Est. Hours (0.5h step)
                      </label>
                      <input
                        id={`estHours-${index}`}
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="20"
                        value={topic.estimatedHours}
                        onChange={(e) =>
                          handleTopicChange(index, 'estimatedHours', parseFloat(e.target.value) || 0)
                        }
                        className={`mt-1 w-full rounded-md border px-2.5 py-2 sm:py-1 text-sm sm:text-xs tabular-nums text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] ${
                          rowErr?.estimatedHours
                            ? 'border-rose-400 bg-rose-50/30'
                            : 'border-[#E7E3DC] bg-white'
                        }`}
                      />
                      {rowErr?.estimatedHours && (
                        <p className="mt-1 text-xs text-rose-600">{rowErr.estimatedHours}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="w-full sm:flex-1 rounded-xl border border-[#E7E3DC] bg-white py-3 sm:py-2.5 text-sm font-medium text-[#475569] hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 text-center touch-manipulation min-h-[44px]"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="w-full sm:flex-1 rounded-xl bg-[#4F46E5] py-3 sm:py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 text-center touch-manipulation min-h-[44px]"
          >
            {isEditing ? 'Confirm & Regenerate Plan' : 'Generate Study Plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
