"use client";

import { useState } from 'react';

interface SkillConfirmationProps {
  applicationId: string;
  analysis: { matched: string[]; missing: string[]; unknown: string[] };
  onConfirmed: () => void;
  isConfirmed: boolean;
}

type SkillState = 'confirmed' | 'rejected' | 'unknown';
type SkillResponse = { state: SkillState, context?: string };

export function SkillConfirmation({ applicationId, analysis, onConfirmed, isConfirmed }: SkillConfirmationProps) {
  const [responses, setResponses] = useState<Record<string, SkillResponse>>(() => {
    const init: Record<string, SkillResponse> = {};
    analysis.matched.forEach(s => init[s] = { state: 'confirmed' });
    return init;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const allSkills = [...analysis.missing, ...analysis.unknown];

  function setSkillState(skill: string, state: SkillState) {
    if (isConfirmed) return;
    setResponses(prev => ({ ...prev, [skill]: { ...prev[skill], state } }));
  }

  function setSkillContext(skill: string, context: string) {
    if (isConfirmed) return;
    setResponses(prev => ({ ...prev, [skill]: { ...prev[skill], context } }));
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    setError('');

    // Ensure all unknown/missing skills have a response
    for (const skill of allSkills) {
      if (!responses[skill]) {
        setResponses(prev => ({ ...prev, [skill]: { state: 'unknown' } }));
      }
    }

    try {
      const res = await fetch('/api/confirm-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          skillResponses: responses
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm skills');
      }

      onConfirmed();
    } catch (err: unknown) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderSkillBlock = (skill: string, type: 'missing' | 'unknown') => {
    const response = responses[skill] || { state: undefined };
    const bgColor = type === 'missing' ? 'bg-red-50' : 'bg-yellow-50';
    const borderColor = type === 'missing' ? 'border-red-200' : 'border-yellow-200';
    const textColor = type === 'missing' ? 'text-red-800' : 'text-yellow-800';
    const label = type === 'missing' ? 'Missing requirement' : 'Unknown requirement';

    return (
      <div key={skill} className={`p-4 ${bgColor} border ${borderColor} rounded-lg`}>
        <p className={`text-xs font-semibold ${textColor} uppercase tracking-wider mb-1`}>{label}</p>
        <p className="text-gray-900 font-medium mb-3">Do you have experience with <strong>{skill}</strong>?</p>
        <div className="flex gap-2 mb-3">
          <button 
            onClick={() => setSkillState(skill, 'confirmed')}
            disabled={isConfirmed || isSubmitting}
            className={`px-4 py-2 text-sm font-medium rounded border ${response.state === 'confirmed' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >Yes</button>
          <button 
            onClick={() => setSkillState(skill, 'rejected')}
            disabled={isConfirmed || isSubmitting}
            className={`px-4 py-2 text-sm font-medium rounded border ${response.state === 'rejected' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >No</button>
          <button 
            onClick={() => setSkillState(skill, 'unknown')}
            disabled={isConfirmed || isSubmitting}
            className={`px-4 py-2 text-sm font-medium rounded border ${response.state === 'unknown' ? 'bg-gray-200 text-gray-800 border-gray-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >Not sure</button>
        </div>
        
        {response.state === 'confirmed' && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Where did you use it?</p>
            <div className="flex flex-wrap gap-2">
              {['Professional', 'Freelance', 'Personal Project', 'Education'].map(ctx => (
                <button
                  key={ctx}
                  onClick={() => setSkillContext(skill, ctx)}
                  disabled={isConfirmed || isSubmitting}
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${response.context === ctx ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >
                  {ctx}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const isAllAnswered = allSkills.every(skill => responses[skill]?.state !== undefined);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Review the skills required for this job. Check the ones you actually possess. 
        We will use this to accurately tailor your CV.
      </p>
      <div className="space-y-6 mt-4">
        {analysis.unknown.map(skill => renderSkillBlock(skill, 'unknown'))}
        {analysis.missing.map(skill => renderSkillBlock(skill, 'missing'))}

        {analysis.unknown.length === 0 && analysis.missing.length === 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">No unknown or missing skills to confirm! You're a perfect match.</p>
          </div>
        )}
      </div>

      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

      {!isConfirmed ? (
        <button
          onClick={handleConfirm}
          disabled={isSubmitting || !isAllAnswered}
          className="mt-6 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:bg-gray-400 transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Confirm Skills'}
        </button>
      ) : (
        <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm font-medium border border-green-200 text-center">
          ✓ Skills confirmed successfully.
        </div>
      )}
    </div>
  );
}
