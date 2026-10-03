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
      
      <div className="flex flex-wrap gap-2 mt-4">
        {allSkills.map(skill => {
          const isSelected = selectedSkills.has(skill);
          let badgeColor = 'bg-gray-100 text-gray-800 border-gray-200';
          
          if (isSelected) {
            if (analysis.matched.includes(skill)) badgeColor = 'bg-green-100 text-green-800 border-green-300';
            else if (analysis.missing.includes(skill)) badgeColor = 'bg-red-100 text-red-800 border-red-300';
            else badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
          }

          return (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              disabled={isConfirmed || isSubmitting}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${badgeColor} ${!isConfirmed && !isSubmitting ? 'hover:brightness-95' : 'opacity-80'}`}
            >
              {isSelected ? '✓ ' : '+ '} {skill}
            </button>
          );
        })}
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
