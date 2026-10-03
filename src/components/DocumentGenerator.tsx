"use client";

import { useState } from 'react';

interface DocumentGeneratorProps {
  applicationId: string;
  disabled: boolean;
}

export function DocumentGenerator({ applicationId, disabled }: DocumentGeneratorProps) {
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [cvResult, setCvResult] = useState<any>(null);
  const [coverLetterResult, setCoverLetterResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function generateDocument(type: 'cv' | 'cover-letter') {
    const isCV = type === 'cv';
    if (isCV) setIsGeneratingCV(true);
    else setIsGeneratingCoverLetter(true);
    
    setError('');

    try {
      const res = await fetch(`/api/generate-${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `Failed to generate ${type}`);
      }

      if (isCV) setCvResult(data.document);
      else setCoverLetterResult(data.document);

    } catch (err: unknown) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (isCV) setIsGeneratingCV(false);
      else setIsGeneratingCoverLetter(false);
    }
  }

  function handleDownloadPDF() {
    window.open(`/api/download-pdf?applicationId=${applicationId}`, '_blank');
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg bg-gray-50 flex flex-col items-center justify-center min-h-[120px]">
          <h3 className="font-semibold mb-2">Tailored CV</h3>
          {!cvResult ? (
            <button
              onClick={() => generateDocument('cv')}
              disabled={disabled || isGeneratingCV}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isGeneratingCV ? 'Generating...' : 'Generate CV'}
            </button>
          ) : (
            <div className="text-green-600 text-sm font-medium">✓ Generated successfully</div>
          )}
        </div>

        <div className="p-4 border rounded-lg bg-gray-50 flex flex-col items-center justify-center min-h-[120px]">
          <h3 className="font-semibold mb-2">Cover Letter</h3>
          {!coverLetterResult ? (
            <button
              onClick={() => generateDocument('cover-letter')}
              disabled={disabled || isGeneratingCoverLetter}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isGeneratingCoverLetter ? 'Generating...' : 'Generate Cover Letter'}
            </button>
          ) : (
            <div className="text-green-600 text-sm font-medium">✓ Generated successfully</div>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {(cvResult || coverLetterResult) && (
        <div className="pt-4 border-t flex justify-end">
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
