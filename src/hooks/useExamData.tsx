import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { exams as staticExams, Exam } from "@/data/exams";
import { fetchLiveExamData, mergeExamData } from "@/lib/fetchExams";
import { supabase } from "@/integrations/supabase/client";

interface ExamDataContextType {
  exams: Exam[];
  dbExams: DbExam[];
  isLive: boolean;
  isFetching: boolean;
  lastFetch: string | null;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface DbExam {
  id: string;
  exam_name: string;
  exam_short: string;
  state: string | null;
  type: string | null;
  last_date: string | null;
  status: string | null;
  category: string | null;
}

const ExamDataContext = createContext<ExamDataContextType | null>(null);

const CACHE_KEY = "examintel-live-data";
const CACHE_TTL = 30 * 60 * 1000;

export function ExamDataProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<Exam[]>(staticExams);
  const [dbExams, setDbExams] = useState<DbExam[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDbExams = async () => {
    const { data } = await supabase
      .from("exam_updates")
      .select("id, exam_name, exam_short, state, type, last_date, status, category")
      .order("last_date", { ascending: true });
    if (data) setDbExams(data as DbExam[]);
  };

  const fetchAndMerge = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const result = await fetchLiveExamData();
      if (result.success && result.data.length > 0) {
        const merged = staticExams.map((exam) => {
          const live = result.data.find((d) => d.examId === exam.id);
          return live ? mergeExamData(exam, live) : exam;
        });
        setExams(merged);
        setIsLive(true);
        const fetchedAt = result.fetchedAt || new Date().toISOString();
        setLastFetch(fetchedAt);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result.data, fetchedAt, timestamp: Date.now() }));
        } catch {}
      } else {
        setError(result.message || "Could not fetch live data");
      }
    } catch {
      setError("Connection error");
    }
    setIsFetching(false);
  };

  useEffect(() => {
    fetchDbExams();
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL && parsed.data?.length > 0) {
          const merged = staticExams.map((exam) => {
            const live = parsed.data.find((d: any) => d.examId === exam.id);
            return live ? mergeExamData(exam, live) : exam;
          });
          setExams(merged);
          setIsLive(true);
          setLastFetch(parsed.fetchedAt);
          return;
        }
      }
    } catch {}

    fetchAndMerge();
  }, []);

  return (
    <ExamDataContext.Provider value={{ exams, dbExams, isLive, isFetching, lastFetch, error, refetch: fetchAndMerge }}>
      {children}
    </ExamDataContext.Provider>
  );
}

export function useExamData() {
  const ctx = useContext(ExamDataContext);
  if (!ctx) throw new Error("useExamData must be used within ExamDataProvider");
  return ctx;
}
