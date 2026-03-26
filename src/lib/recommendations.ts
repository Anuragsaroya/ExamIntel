import { Exam } from "@/data/exams";

export type RiskLevel = "safe" | "moderate" | "risky";

export interface UserProfile {
  stream: string;
  budget: string;
  states: string[];
  targetBranch: string;
  percentage: number | null;
}

export interface ExamRecommendation {
  exam: Exam;
  risk: RiskLevel;
  reasons: string[];
  matchScore: number;
}

function parseBudget(budget: string): number | null {
  const cleaned = budget.replace(/[₹,\s]/g, "");
  const num = parseInt(cleaned);
  return isNaN(num) ? null : num;
}

const examFeeEstimates: Record<string, number> = {
  "jee-main-2026": 50000,
  "bitsat-2026": 400000,
  "wbjee-2026": 80000,
  "viteee-2026": 300000,
  "comedk-2026": 200000,
  "mhtcet-2026": 100000,
  "kcet-2026": 60000,
  "srmjeee-2026": 350000,
};

const examDifficulty: Record<string, number> = {
  "jee-main-2026": 8,
  "bitsat-2026": 8,
  "wbjee-2026": 6,
  "viteee-2026": 5,
  "comedk-2026": 5,
  "mhtcet-2026": 6,
  "kcet-2026": 6,
  "srmjeee-2026": 4,
};

// Map streams to relevant exam categories
const streamCategoryMap: Record<string, string[]> = {
  pcm: ["engineering"],
  pcb: ["medical"],
};

// Branches offered by exams
const examBranches: Record<string, string[]> = {
  "jee-main-2026": ["computer science", "electrical", "mechanical", "civil", "chemical", "aerospace", "electronics"],
  "bitsat-2026": ["computer science", "electrical", "electronics", "mechanical", "chemical", "civil", "pharmacy"],
  "wbjee-2026": ["computer science", "electrical", "mechanical", "civil", "electronics", "it"],
  "viteee-2026": ["computer science", "electrical", "electronics", "mechanical", "civil", "it", "biotech"],
  "comedk-2026": ["computer science", "electrical", "electronics", "mechanical", "civil", "it"],
  "mhtcet-2026": ["computer science", "electrical", "mechanical", "civil", "electronics", "it", "chemical"],
  "kcet-2026": ["computer science", "electrical", "electronics", "mechanical", "civil"],
  "srmjeee-2026": ["computer science", "electrical", "electronics", "mechanical", "civil", "biotech", "it"],
};

export function getRecommendations(exams: Exam[], profile: UserProfile): ExamRecommendation[] {
  const budget = parseBudget(profile.budget);
  const hasProfile = profile.states.length > 0 || !!budget || !!profile.targetBranch;

  return exams.map((exam) => {
    let matchScore = 50;
    const reasons: string[] = [];

    // Stream → category match
    const validCategories = streamCategoryMap[profile.stream] || ["engineering"];
    if (validCategories.includes(exam.category)) {
      matchScore += 10;
      reasons.push(`Matches your ${profile.stream.toUpperCase()} stream`);
    } else {
      matchScore -= 20;
      reasons.push(`Not ideal for ${profile.stream.toUpperCase()} students`);
    }

    // State match
    if (profile.states.length > 0) {
      const hasAllIndia = profile.states.includes("All India");
      const stateMatch = exam.states.some(
        (s) => s === "All India" || profile.states.includes(s)
      );
      if (stateMatch) {
        matchScore += 20;
        const matchedStates = exam.states.filter(s => s === "All India" || profile.states.includes(s));
        reasons.push(`Available in ${matchedStates[0]}`);
      } else if (hasAllIndia && exam.level === "national") {
        matchScore += 15;
        reasons.push("National-level exam — available everywhere");
      } else {
        matchScore -= 15;
        reasons.push("Outside your preferred states");
      }
    }

    // Budget match
    const estFee = examFeeEstimates[exam.id] || 150000;
    if (budget) {
      if (estFee <= budget * 0.7) {
        matchScore += 20;
        reasons.push(`Well within budget (est. ₹${(estFee / 1000).toFixed(0)}K/yr)`);
      } else if (estFee <= budget) {
        matchScore += 15;
        reasons.push(`Within your ₹${(budget / 100000).toFixed(1)}L budget`);
      } else if (estFee <= budget * 1.3) {
        matchScore += 5;
        reasons.push(`Slightly above budget (est. ₹${(estFee / 1000).toFixed(0)}K/yr)`);
      } else {
        matchScore -= 15;
        reasons.push(`Above budget — est. ₹${(estFee / 100000).toFixed(1)}L/yr`);
      }
    }

    // Target branch match
    if (profile.targetBranch) {
      const branch = profile.targetBranch.toLowerCase();
      const branches = examBranches[exam.id] || [];
      const branchMatch = branches.some(b => 
        b.includes(branch) || branch.includes(b) ||
        (branch.includes("cs") && b.includes("computer")) ||
        (branch.includes("cse") && b.includes("computer")) ||
        (branch.includes("ece") && b.includes("electronics")) ||
        (branch.includes("ee") && b.includes("electrical")) ||
        (branch.includes("me") && b.includes("mechanical"))
      );
      if (branchMatch) {
        matchScore += 15;
        reasons.push(`Offers ${profile.targetBranch}`);
      } else if (branches.length > 0) {
        matchScore -= 5;
        reasons.push(`${profile.targetBranch} not confirmed at this college`);
      }
    }

    // Level bonus
    if (exam.level === "national") {
      matchScore += 10;
      reasons.push("Nationally recognized — widely accepted");
    }

    // Difficulty assessment
    const difficulty = examDifficulty[exam.id] || 5;
    if (difficulty >= 7) {
      reasons.push("Highly competitive — needs strong prep");
    } else if (difficulty <= 4) {
      matchScore += 10;
      reasons.push("Moderate difficulty — good safety option");
    }

    // Confidence score
    if (exam.confidenceScore >= 0.9) {
      matchScore += 5;
      reasons.push("High data confidence");
    }

    // Registration status bonus
    if (exam.status === "registration_open") {
      matchScore += 5;
      reasons.push("Registration currently open — apply now!");
    }

    // Clamp
    matchScore = Math.max(10, Math.min(100, matchScore));

    let risk: RiskLevel;
    if (matchScore >= 70) risk = "safe";
    else if (matchScore >= 45) risk = "moderate";
    else risk = "risky";

    return { exam, risk, reasons, matchScore };
  }).sort((a, b) => b.matchScore - a.matchScore);
}
