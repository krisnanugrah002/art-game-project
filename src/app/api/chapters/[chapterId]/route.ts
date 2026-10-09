import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let curriculumCache: any = null;

function getCurriculum() {
  if (!curriculumCache) {
    const filePath = path.join(process.cwd(), 'content', 'curriculum.json');
    const data = fs.readFileSync(filePath, 'utf8');
    curriculumCache = JSON.parse(data);
  }
  return curriculumCache;
}

export function getChapterData(chapterId: string) {
  const curriculum = getCurriculum();
  for (const stage of curriculum.stages) {
    for (const chapter of stage.chapters) {
      if (chapter.id === chapterId) {
        return { chapter, stageId: stage.id };
      }
    }
  }
  return null;
}

export async function GET(req: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    const { chapterId } = await params;
    const data = getChapterData(chapterId);

    if (!data) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Strip out answer_index
    const publicChapter = JSON.parse(JSON.stringify(data.chapter));
    if (publicChapter.quiz) {
      for (const q of publicChapter.quiz) {
        delete q.answer_index;
      }
    }

    return NextResponse.json(publicChapter);
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
