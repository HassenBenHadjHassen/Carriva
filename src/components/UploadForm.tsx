"use client";

import { useState } from 'react';

interface UploadFormProps {
  onProfileCreated: (profileId: string) => void;
}

export function UploadForm({ onProfileCreated }: UploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage('Uploading and extracting CV...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload CV');
      }

      onProfileCreated(data.profileId);
      setMessage('CV successfully parsed and saved!');
    } catch (error: unknown) {
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-2 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-500">PDF or TXT (MAX. 10MB)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept=".pdf,.txt"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>

      {isUploading && (
        <div className="text-sm text-blue-600 animate-pulse text-center">
          {message}
        </div>
      )}

      {!isUploading && message && (
        <div className={`text-sm text-center ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
