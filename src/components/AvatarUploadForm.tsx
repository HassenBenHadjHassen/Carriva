'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AvatarUploadForm({ initialImage }: { initialImage?: string | null }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      // Refresh to get the new avatar across the dashboard
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>
          Upload a professional photo to be included in your generated resumes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        {initialImage && (
          <img
            src={initialImage}
            alt="Profile Avatar"
            className="w-24 h-24 rounded-full object-cover border bg-muted"
          />
        )}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            className="relative"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4 mr-2" />
            )}
            {isUploading ? 'Uploading...' : 'Choose Image'}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
