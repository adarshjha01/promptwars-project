"use client";

import React, { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { getUserTriageHistory } from "@/lib/firestore.service";
import { Clock, ShieldAlert, ShieldCheck, Shield, ChevronDown, ChevronUp } from "lucide-react";

export default function TriageHistory({ user }: { user: User }) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getUserTriageHistory(user.uid);
        setHistory(data);
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [user.uid]);

  if (isLoading) return <div className="p-8 text-center text-muted animate-pulse">Loading past records...</div>;

  if (history.length === 0) {
    return (
      <div className="glass-card p-8 text-center mt-8">
        <Clock className="mx-auto mb-3 text-muted" size={32} />
        <h3 className="text-lg font-medium text-foreground">No History Found</h3>
        <p className="text-sm text-muted">Your saved triage analyses will appear here.</p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
        <Clock className="text-accent" /> Past Triage Records
      </h2>
      
      {history.map((record) => {
        const date = record.createdAt?.toDate ? record.createdAt.toDate().toLocaleDateString() : "Recent";
        const isExpanded = expandedId === record.id;
        
        return (
          <div key={record.id} className="glass-card border border-border-custom overflow-hidden transition-all duration-200">
            {/* Header / Clickable row */}
            <div 
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-elevated/50"
              onClick={() => toggleExpand(record.id)}
            >
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted font-medium w-24">{date}</div>
                <div className="text-sm font-semibold truncate max-w-[200px]">
                  {record.result?.identified_medications?.[0] || "Unknown Medication"}...
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                    record.result?.risk_level === 'Low' ? 'text-success border-success/20 bg-success-muted' :
                    record.result?.risk_level === 'Medium' ? 'text-warning border-warning/20 bg-warning-muted' :
                    'text-danger border-danger/20 bg-danger-muted'
                 }`}>
                   {record.result?.risk_level?.toUpperCase()} RISK
                 </span>
                 {isExpanded ? <ChevronUp size={18} className="text-muted"/> : <ChevronDown size={18} className="text-muted"/>}
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && record.result && (
              <div className="p-4 bg-surface-elevated/30 border-t border-border-custom">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Medications & Dosages</h4>
                    <ul className="text-sm space-y-1">
                      {record.result.identified_medications?.map((m: string, i: number) => (
                        <li key={i} className="text-foreground border-l-2 border-accent pl-2">{m}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Symptoms</h4>
                    <ul className="text-sm space-y-1">
                      {record.result.symptoms?.map((s: string, i: number) => (
                        <li key={i} className="text-foreground list-disc ml-4">{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4">
                   <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Action Plan</h4>
                   <p className="text-sm text-foreground/90">{record.result.action_plan?.[0]}...</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}