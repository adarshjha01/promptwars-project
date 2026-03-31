import { collection, query, orderBy, getDocs, addDoc } from "firebase/firestore";
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


export async function getUserTriageHistory(userId: string) {
  try {
    const historyRef = collection(db, "users", userId, "triageHistory");
    // Order by newest first
    const q = query(historyRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const history: any[] = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() });
    });
    
    return history;
  } catch (error) {
    console.error("Error fetching triage history: ", error);
    throw error;
  }
}