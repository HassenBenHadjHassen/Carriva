"use client";

import { useState } from 'react';

import { JobAnalysisType } from '../ai/schemas';

interface JobAnalysisFormProps {
  profileId: string | null;
  onAnalysisComplete?: (applicationId: string, analysis: JobAnalysisType) => void;
}

export function JobAnalysisForm({ profileId, onAnalysisComplete }: JobAnalysisFormProps) {
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ job: { title: string; company: string; }; analysis: { matched: string[]; missing: string[]; unknown: string[]; } } | null>(null);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    if (!profileId) {
      setError("Please upload your CV first to create a profile.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please paste a job description.");
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, jobDescription })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze job');
      }

      setResult(data);
      if (onAnalysisComplete) {
        onAnalysisComplete(data.applicationId, data.analysis);
      }
    } catch (err: unknown) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
        placeholder="Paste the job description here..."
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        disabled={isAnalyzing}
      />
      
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !profileId}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isAnalyzing ? 'Analyzing Match...' : 'Analyze Match'}
      </button>

      {!profileId && (
        <p className="text-xs text-red-500">You must complete Step 1 (Upload CV) before analyzing a job.</p>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}

      {result && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">Extracted Role:</h3>
            <p className="text-gray-700">{result.job.title} at {result.job.company}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-green-700">Matched Skills:</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {result.analysis.matched.length === 0 && <span className="text-gray-500 italic">None identified</span>}
              {result.analysis.matched.map((skill: string) => (
                <span key={skill} className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">{skill}</span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-red-700">Missing Skills:</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {result.analysis.missing.length === 0 && <span className="text-gray-500 italic">None identified</span>}
              {result.analysis.missing.map((skill: string) => (
                <span key={skill} className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">{skill}</span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-yellow-700">Unknown Skills (Need Clarification):</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {result.analysis.unknown.length === 0 && <span className="text-gray-500 italic">None identified</span>}
              {result.analysis.unknown.map((skill: string) => (
                <span key={skill} className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
