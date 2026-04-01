/**
 * AI Learning API
 * Quiz API  -> diagnostic / final / lesson quiz
 * RAG API   -> module content / flashcards
 */

const getQuizBaseUrl = (): string => {
  const base = import.meta.env?.VITE_QUIZ_API_BASE_URL;
  if (!base) return 'https://common-streets-guess.loca.lt'; // كرابط احتياطي في حال لم يقرأ من الـ .env
  
  // إزالة أي شرطة مائلة من النهاية لتوحيد الشكل
  return base.trim().replace(/\/+$/, '');
};


const getRagBaseUrl = (): string => {
  const base = import.meta.env?.VITE_RAG_API_BASE_URL;
  if (typeof base === 'string' && base.trim()) return base.replace(/\/$/, '');
  return '';
};

const getAuthHeaders = (): Record<string, string> => {
  const token = import.meta.env?.VITE_AI_API_TOKEN;
  
  // غيّرنا اسم الهيدر ليتوافق مع أداة Localtunnel الجديدة
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true' // <--- هذا هو السطر الجديد الخاص بـ Localtunnel
  };
  
  if (typeof token === 'string' && token.trim()) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};




async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers as Record<string, string>),
      },
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ==============================
// Shared types
// ==============================

export interface QuizPerformanceItem {
  subject: string;
  score: number;
  total: number;
  percentage: number;
  level: string;
}

export interface QuizDetailedResult {
  question_id: number;
  subject: string;
  is_correct: boolean;
  user_answer: string;
  correct_letter: string;
  ai_explanation: string;
}

export interface DiagnosticStudentAnswerPayload {
  question_id: number;
  subject: string;
  question_text: string;
  user_answer: string;
  correct_letter: string;
  reference_explanation: string;
}

// ==============================
// Diagnostic quiz
// ==============================

export interface DiagnosticApiQuestion {
  question_id: number;
  subject: string;
  question_text: string;
  correct_letter: string;
  reference_explanation: string;
}

export interface DiagnosticQuizResponse {
  status: string;
  data: DiagnosticApiQuestion[];
}

export interface CurriculumSlide {
  slide_number?: number;
  title: string;
  explanation: string;
  key_points: string[];
  example?: string | null;
}

export interface CurriculumLesson {
  lesson_number?: number;
  lesson_title: string;
  slides: CurriculumSlide[];
}

export interface CurriculumUnit {
  unit_number?: number;
  unit_title?: string;
  lessons: CurriculumLesson[];
}

export interface CurriculumSubject {
  subject: string;
  student_level?: string;
  units: CurriculumUnit[];
}

export interface CurriculumResponse {
  success?: boolean;
  query?: string;
  result?: {
    subjects?: CurriculumSubject[];
  };
}

export interface DiagnosticSubmitResponse {
  status: string;
  total_score: number;
  total_questions: number;
  total_percentage: number;
  performance_by_subject: QuizPerformanceItem[];
  detailed_results: QuizDetailedResult[];
  student_profile?: string;
  curriculum?: CurriculumResponse | null;
}

export async function getDiagnosticQuiz(): Promise<DiagnosticQuizResponse | null> {
  const base = getQuizBaseUrl();
  if (!base) return null;

  return fetchJson<DiagnosticQuizResponse>(`${base}/get_quiz`, {
    method: 'GET',
  });
}

export async function submitDiagnosticQuiz(
  answers: DiagnosticStudentAnswerPayload[]
): Promise<DiagnosticSubmitResponse | null> {
  const base = getQuizBaseUrl();
  if (!base) return null;

  const result = await fetchJson<DiagnosticSubmitResponse>(`${base}/submit_quiz`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });

  if (result) {
    localStorage.setItem('afaq_diagnostic_result', JSON.stringify(result));

    if (result.curriculum) {
      localStorage.setItem('afaq_curriculum', JSON.stringify(result.curriculum));
    }

    if (result.student_profile) {
      localStorage.setItem('afaq_student_profile', result.student_profile);
    }
  }

  return result;
}

export function getSavedCurriculum(): CurriculumResponse | null {
  try {
    const raw = localStorage.getItem('afaq_curriculum');
    if (!raw) return null;
    return JSON.parse(raw) as CurriculumResponse;
  } catch {
    return null;
  }
}

export function getSavedDiagnosticResult(): DiagnosticSubmitResponse | null {
  try {
    const raw = localStorage.getItem('afaq_diagnostic_result');
    if (!raw) return null;
    return JSON.parse(raw) as DiagnosticSubmitResponse;
  } catch {
    return null;
  }
}

// ==============================
// Lesson quiz
// ==============================

export interface LessonQuizApiQuestion {
  question_id: number;
  subject: string;
  topic: string;
  question_text: string;
  display_question: string;
  options: string[];
  correct_letter: string;
  reference_explanation: string;
}

export interface LessonQuizResponse {
  status: string;
  title: string;
  topic: string;
  questions: LessonQuizApiQuestion[];
}

export interface LessonQuizSubmitResponse {
  status: string;
  topic: string;
  total_score: number;
  total_questions: number;
  total_percentage: number;
  performance_by_subject: QuizPerformanceItem[];
  detailed_results: QuizDetailedResult[];
}

export async function getLessonQuiz(
  topic: string,
  questionCount = 5
): Promise<LessonQuizResponse | null> {
  const base = getQuizBaseUrl();
  if (!base) return null;

  return fetchJson<LessonQuizResponse>(`${base}/lesson_quiz/get`, {
    method: 'POST',
    body: JSON.stringify({
      topic,
      question_count: questionCount,
    }),
  });
}

export async function submitLessonQuiz(
  topic: string,
  answers: DiagnosticStudentAnswerPayload[]
): Promise<LessonQuizSubmitResponse | null> {
  const base = getQuizBaseUrl();
  if (!base) return null;

  return fetchJson<LessonQuizSubmitResponse>(`${base}/lesson_quiz/submit`, {
    method: 'POST',
    body: JSON.stringify({
      topic,
      answers,
    }),
  });
}

// ==============================
// Plan
// ==============================

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
  const base = getQuizBaseUrl();
  const base2= 'http://127.0.0.1:9000';
  if (!base) return null;

  return fetchJson<GeneratedPlanItem[]>(`${base2}/generate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ==============================
// Flashcards (RAG مباشرة)
// ==============================

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
}

export async function generateFlashcards(moduleId: string, topic?: string): Promise<FlashcardItem[] | null> {
  const base = getRagBaseUrl();
  if (!base) return null;

  return fetchJson<FlashcardItem[]>(`${base}/ai/flashcards`, {
    method: 'POST',
    body: JSON.stringify({ moduleId, topic }),
  });
}

// ==============================
// General quiz per module
// ==============================

export interface QuizQuestion {
  question_id: number;
  subject: string;
  topic: string;
  question_text: string;
  reference_explanation: string;
  correct_letter: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface GeneratedQuiz {
  title: string;
  topic: string;
  questions: QuizQuestion[];
}

export interface CheckQuizAnswerPayload {
  question_id: number;
  subject: string;
  topic: string;
  question_text: string;
  user_answer: number;
  correct_letter: string;
  reference_explanation: string;
}

export interface CheckQuizAnswerResponse {
  status: string;
  question_id: number;
  topic: string;
  subject: string;
  is_correct: boolean;
  user_answer: string;
  correct_letter: string;
  ai_explanation: string;
}

// ==============================
// General quiz per module
// ==============================

export async function generateQuiz(topicName: string): Promise<GeneratedQuiz | null> {
  const base = getQuizBaseUrl();
  
  // استخراج اسم الدرس الصافي إذا كان topicName عبارة عن JSON
  let cleanTopic = topicName;
  try {
    const parsed = JSON.parse(topicName);
    if (parsed && parsed.lessonTitle) {
      cleanTopic = parsed.lessonTitle; // نأخذ "حركة الكواكب والجاذبية" فقط
    } else if (parsed && parsed.topic) {
      cleanTopic = parsed.topic;
    }
  } catch (e) {
    // إذا لم يكن JSON، نتركه كما هو (مثلاً "الضوء وطاقة الكم")
  }

  // الآن نرسل cleanTopic النظيف في الرابط
  const url = `${base}/ai/quiz?topic=${encodeURIComponent(cleanTopic)}&question_count=5`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true" 
      }
    });

    if (!response.ok) {
      console.error(`Error ${response.status}: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    return data as GeneratedQuiz;
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

export async function checkQuizAnswer(
  payload: CheckQuizAnswerPayload
): Promise<CheckQuizAnswerResponse | null> {
  const base = getQuizBaseUrl();
  const url = `${base}/ai/quiz/check/`; // المسار مع شرطة مائلة لمنع 404
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
       console.error(`Error ${response.status}: ${response.statusText}`);
       return null;
    }
    return (await response.json()) as CheckQuizAnswerResponse;
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

// ==============================
// Final exam
// ==============================

export interface FinalExamQuestion {
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export async function generateFinalExam(planId: string, level?: string): Promise<FinalExamQuestion[] | null> {
  const base = getQuizBaseUrl();
  if (!base) return null;

  return fetchJson<FinalExamQuestion[]>(`${base}/ai/final-exam`, {
    method: 'POST',
    body: JSON.stringify({ planId, level }),
  });
}

// ==============================
// Module content / slides (RAG مباشرة)
// ==============================

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

function normalizeText(value: string): string {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/[()\-–—]/g, '')
    .replace(/^ال/, '')
    .replace(/[^\u0600-\u06FF0-9\s]/g, '')
    .trim();
}

function parseModuleId(moduleId: string): {
  subject?: string;
  lessonTitle?: string;
  unitTitle?: string;
  lessonNumber?: number;
  subjectIndex?: number;
  unitIndex?: number;
  lessonIndex?: number;
} {
  try {
    const parsed = JSON.parse(moduleId);
    if (parsed && typeof parsed === 'object') {
      return {
        subject: parsed.subject || '',
        lessonTitle: parsed.lessonTitle || '',
        unitTitle: parsed.unitTitle || '',
        lessonNumber: parsed.lessonNumber,
        subjectIndex: parsed.subjectIndex,
        unitIndex: parsed.unitIndex,
        lessonIndex: parsed.lessonIndex,
      };
    }
    return { lessonTitle: moduleId };
  } catch {
    return { lessonTitle: moduleId };
  }
}

function curriculumToModuleContent(
  curriculum: CurriculumResponse | null,
  moduleId: string
): ModuleContentResponse | null {
  const subjects = curriculum?.result?.subjects;
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) return null;

  const parsed = parseModuleId(moduleId);
  const targetSubject = normalizeText(parsed.subject || '');
  const targetLesson = normalizeText(parsed.lessonTitle || '');
  const targetUnit = normalizeText(parsed.unitTitle || '');

  if (
    typeof parsed.subjectIndex === 'number' &&
    typeof parsed.unitIndex === 'number' &&
    typeof parsed.lessonIndex === 'number'
  ) {
    const subject = subjects[parsed.subjectIndex];
    const unit = subject?.units?.[parsed.unitIndex];
    const lesson = unit?.lessons?.[parsed.lessonIndex];

    if (lesson && Array.isArray(lesson.slides) && lesson.slides.length > 0) {
      return {
        title: lesson.lesson_title || subject.subject || 'الوحدة الدراسية',
        slides: lesson.slides.map((slide) => ({
          title: slide.title || lesson.lesson_title || 'شريحة',
          content: slide.explanation || '',
          example: slide.example ?? undefined,
          keyPoints: Array.isArray(slide.key_points) ? slide.key_points : [],
        })),
        quickQuestions: {},
      };
    }
  }

  for (const subject of subjects) {
    const subjectName = normalizeText(subject.subject || '');
    if (targetSubject && subjectName !== targetSubject) continue;

    for (const unit of subject.units || []) {
      const unitName = normalizeText(unit.unit_title || '');
      if (targetUnit && unitName !== targetUnit) continue;

      for (const lesson of unit.lessons || []) {
        const lessonTitle = normalizeText(lesson.lesson_title || '');
        const lessonNumber = lesson.lesson_number ?? -1;

        const titleMatches = targetLesson && lessonTitle === targetLesson;
        const numberMatches =
          typeof parsed.lessonNumber === 'number' && lessonNumber === parsed.lessonNumber;

        if (!titleMatches && !numberMatches) continue;

        return {
          title: lesson.lesson_title || subject.subject || 'الوحدة الدراسية',
          slides: (lesson.slides || []).map((slide) => ({
            title: slide.title || lesson.lesson_title || 'شريحة',
            content: slide.explanation || '',
            example: slide.example ?? undefined,
            keyPoints: Array.isArray(slide.key_points) ? slide.key_points : [],
          })),
          quickQuestions: {},
        };
      }
    }
  }

  return null;
}

export async function getModuleContent(moduleId: string, topic?: string): Promise<ModuleContentResponse | null> {
  const savedCurriculum = getSavedCurriculum();
  const savedModule = curriculumToModuleContent(savedCurriculum, moduleId);
  if (savedModule) return savedModule;

  const base = getRagBaseUrl();
  if (!base) return null;

  return fetchJson<ModuleContentResponse>(`${base}/ai/module-content`, {
    method: 'POST',
    body: JSON.stringify({ moduleId, topic }),
  });
}

export function isAiApiConfigured(): boolean {
  return getQuizBaseUrl().length > 0 || getRagBaseUrl().length > 0;
}