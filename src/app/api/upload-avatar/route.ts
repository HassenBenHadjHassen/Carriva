import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
    await fs.mkdir(avatarsDir, { recursive: true });

    const ext = path.extname(file.name) || '.png';
    const filename = `${user.id}${ext}`;
    const filePath = path.join(avatarsDir, filename);

    await fs.writeFile(filePath, buffer);

    const avatarUrl = `/avatars/${filename}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { image: avatarUrl }
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
