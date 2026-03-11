/**
 * AI Learning API – talks to your AI server for plans, flashcards, quizzes, exams, and slides.
 * If VITE_AI_API_BASE_URL is not set or a request fails, the app falls back to local static data.
 */

const getBaseUrl = (): string => {
  const base = import.meta.env?.VITE_AI_API_BASE_URL;
  if (typeof base === 'string' && base.trim()) return base.replace(/\/$/, '');
  return '';
};

const getAuthHeaders = (): Record<string, string> => {
  const token = import.meta.env?.VITE_AI_API_TOKEN;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof token === 'string' && token.trim()) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...getAuthHeaders(), ...(options.headers as Record<string, string>) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// —— Plan (after diagnostic + preferences) ——
export interface GeneratePlanPayload {
  userId?: string;
  level: string;
  preferences: {
    dailyStudyTime: number;
    studyDuration: number;
    studyDays: string[];
    preferredTime: string;
    goals: string[];
    intensity: string;
  };
}

export interface GeneratedPlanItem {
  id: string;
  title: string;
  level: string;
  status: 'in-progress' | 'completed' | 'not-started';
  completionPercentage: number;
  completedModules: string[];
  quizScores: Record<string, number>;
  createdAt: string;
}

export async function generatePlan(payload: GeneratePlanPayload): Promise<GeneratedPlanItem[] | null> {
  const base = getBaseUrl();
  if (!base) return null;
  return fetchJson<GeneratedPlanItem[]>(`${base}/ai/plan`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// —— Flashcards (per module) ——
export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
}

export async function generateFlashcards(moduleId: string, topic?: string): Promise<FlashcardItem[] | null> {
  const base = getBaseUrl();
  if (!base) return null;
  return fetchJson<FlashcardItem[]>(`${base}/ai/flashcards`, {
    method: 'POST',
    body: JSON.stringify({ moduleId, topic }),
  });
}

// —— Quiz (per module) ——
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
}

export async function generateQuiz(moduleId: string, topic?: string): Promise<GeneratedQuiz | null> {
  const base = getBaseUrl();
  if (!base) return null;
  return fetchJson<GeneratedQuiz>(`${base}/ai/quiz`, {
    method: 'POST',
    body: JSON.stringify({ moduleId, topic }),
  });
}

// —— Final exam (per plan) ——
export interface FinalExamQuestion {
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export async function generateFinalExam(planId: string, level?: string): Promise<FinalExamQuestion[] | null> {
  const base = getBaseUrl();
  if (!base) return null;
  return fetchJson<FinalExamQuestion[]>(`${base}/ai/final-exam`, {
    method: 'POST',
    body: JSON.stringify({ planId, level }),
  });
}

// —— Module content (slides + optional quick questions) ——
export interface SlideItem {
  title: string;
  content: string;
  example?: string;
  keyPoints: string[];
}

export interface QuickQuestionItem {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface ModuleContentResponse {
  title: string;
  slides: SlideItem[];
  quickQuestions?: Record<number, QuickQuestionItem>;
}

export async function getModuleContent(moduleId: string, topic?: string): Promise<ModuleContentResponse | null> {
  const base = getBaseUrl();
  if (!base) return null;
  return fetchJson<ModuleContentResponse>(`${base}/ai/module-content`, {
    method: 'POST',
    body: JSON.stringify({ moduleId, topic }),
  });
}

export function isAiApiConfigured(): boolean {
  return getBaseUrl().length > 0;
}
