import CURRICULUM_DATA from '../../../../../content/curriculum.json';
const CURRICULUM = CURRICULUM_DATA as any;
import { notFound } from 'next/navigation';
import ClientLesson from './ClientLesson';

export default async function LessonPage({ params }: { params: Promise<{ stageId: string, chapterId: string }> }) {
  const { stageId, chapterId } = await params;
  
  const stage = CURRICULUM.stages.find((s: any) => s.id === stageId);
  const chapter = stage?.chapters.find((c: any) => c.id === chapterId);

  if (!stage || !chapter) {
    return notFound();
  }

  return <ClientLesson stage={stage} chapter={chapter} />;
}
