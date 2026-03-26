import { supabase } from "@/integrations/supabase/client";
import { Exam } from "@/data/exams";

export interface LiveExamData {
  examId: string;
  examName: string;
  extracted: boolean;
  data?: {
    registration_start?: string;
    registration_end?: string;
    admit_card_date?: string;
    exam_date?: string;
    result_date?: string;
    application_fee?: string;
    eligibility?: string;
    important_notice?: string;
    confidence_score: number;
  };
}

export interface FetchExamsResponse {
  success: boolean;
  data: LiveExamData[];
  fetchedAt?: string;
  message?: string;
}

export async function fetchLiveExamData(examIds?: string[]): Promise<FetchExamsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-exams", {
      body: { examIds },
    });

    if (error) {
      console.error("Edge function error:", error);
      return { success: false, data: [], message: "Failed to fetch live data" };
    }

    return data as FetchExamsResponse;
  } catch (e) {
    console.error("Fetch error:", e);
    return { success: false, data: [], message: "Connection error" };
  }
}

export function mergeExamData(baseExam: Exam, liveData: LiveExamData): Exam {
  if (!liveData.extracted || !liveData.data) return baseExam;

  const d = liveData.data;
  const merged = { ...baseExam };

  if (d.registration_start) merged.registrationStart = d.registration_start;
  if (d.registration_end) merged.registrationEnd = d.registration_end;
  if (d.admit_card_date) merged.admitCardDate = d.admit_card_date;
  if (d.exam_date) merged.examDate = d.exam_date;
  if (d.result_date) merged.resultDate = d.result_date;
  if (d.application_fee) merged.applicationFee = d.application_fee;
  if (d.eligibility) merged.eligibility = d.eligibility;
  if (d.confidence_score) merged.confidenceScore = d.confidence_score;

  // Rebuild timeline
  merged.timeline = [
    { label: "Registration Opens", date: merged.registrationStart, status: merged.registrationStart && new Date(merged.registrationStart) < new Date() ? "completed" as const : "upcoming" as const },
    { label: "Registration Closes", date: merged.registrationEnd, status: merged.registrationEnd && new Date(merged.registrationEnd) < new Date() ? "completed" as const : merged.registrationEnd && new Date(merged.registrationEnd) > new Date() ? "active" as const : "upcoming" as const },
    { label: "Admit Card", date: merged.admitCardDate, status: merged.admitCardDate && new Date(merged.admitCardDate) < new Date() ? "completed" as const : "upcoming" as const },
    { label: "Exam Date", date: merged.examDate, status: "upcoming" as const },
    { label: "Result", date: merged.resultDate, status: "upcoming" as const },
  ];

  return merged;
}
