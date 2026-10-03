"use client";

import { useState } from 'react';

interface SkillConfirmationProps {
  applicationId: string;
  analysis: { matched: string[]; missing: string[]; unknown: string[] };
  onConfirmed: () => void;
  isConfirmed: boolean;
}

export function SkillConfirmation({ applicationId, analysis, onConfirmed, isConfirmed }: SkillConfirmationProps) {
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set([...analysis.matched]));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const allSkills = [...analysis.matched, ...analysis.missing, ...analysis.unknown];

  function toggleSkill(skill: string) {
    if (isConfirmed) return;
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skill)) {
      newSelected.delete(skill);
    } else {
      newSelected.add(skill);
    }
    setSelectedSkills(newSelected);
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/confirm-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          confirmedSkills: Array.from(selectedSkills)
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Review the skills required for this job. Check the ones you actually possess. 
        We will use this to accurately tailor your CV.
      </p>
      <div className="space-y-6 mt-4">
        {analysis.unknown.map(skill => (
          <div key={skill} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-1">Unknown requirement</p>
            <p className="text-gray-900 font-medium mb-3">Do you have experience with <strong>{skill}</strong>?</p>
            <div className="flex gap-2">
              <button 
                onClick={() => toggleSkill(skill)}
                disabled={isConfirmed || isSubmitting}
                className={`px-4 py-2 text-sm font-medium rounded border ${selectedSkills.has(skill) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >Yes</button>
              <button 
                onClick={() => {
                  if (isConfirmed) return;
                  const newSelected = new Set(selectedSkills);
                  newSelected.delete(skill);
                  setSelectedSkills(newSelected);
                }}
                disabled={isConfirmed || isSubmitting}
                className={`px-4 py-2 text-sm font-medium rounded border ${!selectedSkills.has(skill) ? 'bg-gray-200 text-gray-800 border-gray-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >No / Not sure</button>
            </div>
          </div>
        ))}

        {analysis.missing.map(skill => (
          <div key={skill} className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-800 uppercase tracking-wider mb-1">Missing requirement</p>
            <p className="text-gray-900 font-medium mb-3">Do you have experience with <strong>{skill}</strong>?</p>
            <div className="flex gap-2">
              <button 
                onClick={() => toggleSkill(skill)}
                disabled={isConfirmed || isSubmitting}
                className={`px-4 py-2 text-sm font-medium rounded border ${selectedSkills.has(skill) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >Yes</button>
              <button 
                onClick={() => {
                  if (isConfirmed) return;
                  const newSelected = new Set(selectedSkills);
                  newSelected.delete(skill);
                  setSelectedSkills(newSelected);
                }}
                disabled={isConfirmed || isSubmitting}
                className={`px-4 py-2 text-sm font-medium rounded border ${!selectedSkills.has(skill) ? 'bg-gray-200 text-gray-800 border-gray-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >No</button>
            </div>
          </div>
        ))}

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
          disabled={isSubmitting || selectedSkills.size === 0}
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
