import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase.config";
import type { TriageResult } from "@/lib/schema";

export async function saveTriageResult(userId: string, triageData: TriageResult) {
  const ref = collection(db, "users", userId, "triage_logs");
  const docRef = await addDoc(ref, {
    ...triageData,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}
