"use client";

import { useState } from 'react';
import { UploadForm } from '../components/UploadForm';
import { JobAnalysisForm } from '../components/JobAnalysisForm';
import { SkillConfirmation } from '../components/SkillConfirmation';
import { DocumentGenerator } from '../components/DocumentGenerator';

export default function DashboardPage() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [skillsConfirmed, setSkillsConfirmed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
      <main className="max-w-4xl w-full space-y-8 bg-white p-12 rounded-2xl shadow-sm border border-gray-100">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Carriva Dashboard</h1>
          <p className="text-lg text-gray-500">Your AI-powered career companion.</p>
        </header>

        {profileId && (
          <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 text-sm flex items-center justify-between">
            <span><strong>Active Profile:</strong> {profileId}</span>
            <button onClick={() => {
              setProfileId(null);
              setApplicationId(null);
              setAnalysisResult(null);
              setSkillsConfirmed(false);
            }} className="text-green-900 underline hover:text-green-700">Clear</button>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 border rounded-xl transition-colors ${!profileId ? 'border-blue-300 bg-blue-50/30 shadow-sm' : 'border-gray-200'}`}>
            <h2 className="text-xl font-semibold mb-4">1. Upload CV</h2>
            <UploadForm onProfileCreated={setProfileId} />
          </div>
          
          <div className={`p-6 border rounded-xl transition-colors ${profileId ? 'border-blue-300 bg-blue-50/30 shadow-sm' : 'border-gray-200 opacity-75'}`}>
            <h2 className="text-xl font-semibold mb-4">2. Analyze Job</h2>
            <JobAnalysisForm 
              profileId={profileId} 
              onAnalysisComplete={(appId, analysis) => {
                setApplicationId(appId);
                setAnalysisResult(analysis);
                setSkillsConfirmed(false);
              }}
            />
          </div>
        </section>

        {applicationId && analysisResult && (
          <section className="space-y-6">
            <div className={`p-6 border rounded-xl transition-colors ${!skillsConfirmed ? 'border-blue-300 bg-blue-50/30 shadow-sm' : 'border-gray-200'}`}>
              <h2 className="text-xl font-semibold mb-4">3. Skill Confirmation</h2>
              <SkillConfirmation 
                applicationId={applicationId} 
                analysis={analysisResult} 
                onConfirmed={() => setSkillsConfirmed(true)} 
                isConfirmed={skillsConfirmed}
              />
            </div>
            
            <div className={`p-6 border rounded-xl transition-colors ${skillsConfirmed ? 'border-blue-300 bg-blue-50/30 shadow-sm' : 'border-gray-200 opacity-75'}`}>
              <h2 className="text-xl font-semibold mb-4">4. Generate Documents</h2>
              <DocumentGenerator 
                applicationId={applicationId} 
                disabled={!skillsConfirmed} 
              />
            </div>
          </section>
        )}

        <footer className="pt-8 border-t border-gray-100 text-sm text-gray-400">
          <p>Orchestration handled cleanly by domain services. UI remains thin.</p>
        </footer>
      </main>
    </div>
  );
}
