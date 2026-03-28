import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.config';

export async function saveTriageResult(userId: string, triageData: any) {
  const ref = collection(db, 'users', userId, 'triage_logs');
  const docRef = await addDoc(ref, {
    ...triageData,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}
