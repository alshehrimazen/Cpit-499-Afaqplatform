/// <reference types="vite/client" />

import { auth, saveCurriculum } from '../lib/firebase';

const getQuizBaseUrl = (): string => {
  const base = import.meta.env?.VITE_QUIZ_API_BASE_URL;
  if (!base) return 'https://common-streets-guess.loca.lt';
  return base.trim().replace(/\/+$/, '');
};

const getRagBaseUrl = (): string => {
  const base = import.meta.env?.VITE_RAG_API_BASE_URL;
  if (typeof base === 'string' && base.trim()) return base.replace(/\/$/, '');
  return 'http://127.0.0.1:9000';
};

const getAuthHeaders = (): Record<string, string> => {
  const token = import.meta.env?.VITE_AI_API_TOKEN;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
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

    const text = await res.text();
    if (!res.ok) {
      try {
        const body = JSON.parse(text);
        console.error('API error:', res.status, body);
      } catch {
        console.error('API error:', res.status, text);
      }
      return null;
    }

    try {
      return JSON.parse(text) as T;
    } catch (e) {
      console.error('Invalid JSON from API:', e, text);
      return null;
    }
  } catch (error) {
    console.error('Fetch failed:', error);
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
  return fetchJson<DiagnosticQuizResponse>(`${base}/get_quiz`, { method: 'GET' });
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

      // ✅ Save curriculum to Firestore
      const uid = auth.currentUser?.uid;
      if (uid) {
        try {
          const email = auth.currentUser?.email || '';
          await saveCurriculum(uid, result.curriculum, email);
        } catch (e) {
          console.error('Failed to save curriculum to Firestore:', e);
        }
      }
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
    body: JSON.stringify({ topic, question_count: questionCount }),
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
    body: JSON.stringify({ topic, answers }),
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

export interface GeneratePlanResponse {
  success: boolean;
  query: string;
  result: {
    subjects?: CurriculumSubject[];
  };
}

function buildPlanQuery(payload: GeneratePlanPayload): string {
  const savedProfile = localStorage.getItem('afaq_student_profile');
  if (savedProfile && savedProfile.trim()) {
    return savedProfile;
  }

  const levelMap: Record<string, string> = {
    beginner: 'ضعيف',
    intermediate: 'متوسط',
    advanced: 'جيد',
  };

  const levelText = levelMap[payload.level] || 'متوسط';
  const goalsText = payload.preferences.goals.length > 0
    ? `الأهداف: ${payload.preferences.goals.join('، ')}`
    : '';

  return `رياضيات ${levelText} ${goalsText}`.trim();
}

export async function generatePlan(payload: GeneratePlanPayload): Promise<GeneratePlanResponse | null> {
  const base = getRagBaseUrl();
  if (!base) return null;
  const query = buildPlanQuery(payload);
  return fetchJson<GeneratePlanResponse>(`${base}/generate`, {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

// ==============================
// Flashcards
// ==============================

export interface FlashcardItem {
  front: string;
  back: string;
}

function buildModuleTopic(moduleId: string, topic?: string): string {
  if (topic && topic.trim()) return topic.trim();

  const parsed = parseModuleId(moduleId);
  const parts: string[] = [];
  if (parsed.subject) parts.push(parsed.subject);
  if (parsed.unitTitle && parsed.unitTitle !== parsed.lessonTitle) parts.push(parsed.unitTitle);
  if (parsed.lessonTitle) parts.push(parsed.lessonTitle);

  return parts.length > 0 ? parts.join(' - ') : moduleId;
}

export async function generateFlashcards(moduleId: string, topic?: string): Promise<FlashcardItem[] | null> {
  const base = getRagBaseUrl();
  if (!base) return null;

  const savedModule = getModuleContentFromSavedCurriculum(moduleId);
  const slidesPayload = savedModule?.slides?.map((slide) => ({
    title: slide.title,
    explanation: slide.content,
    example: slide.example ?? '',
    key_points: Array.isArray(slide.keyPoints) ? slide.keyPoints : [],
  })) || [];

  const payload: Record<string, unknown> = {
    moduleId,
    topic: buildModuleTopic(moduleId, topic),
  };

  if (slidesPayload.length > 0) {
    payload.slides = slidesPayload;
  }

  return fetchJson<FlashcardItem[]>(`${base}/ai/flashcards`, {
    method: 'POST',
    body: JSON.stringify(payload),
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

export async function generateQuiz(topicName: string): Promise<GeneratedQuiz | null> {
  const base = getQuizBaseUrl();

  let cleanTopic = topicName;
  try {
    const parsed = JSON.parse(topicName);
    if (parsed && parsed.lessonTitle) {
      cleanTopic = parsed.lessonTitle;
    } else if (parsed && parsed.topic) {
      cleanTopic = parsed.topic;
    }
  } catch (e) {
    // not JSON, use as-is
  }

  const url = `${base}/ai/quiz?topic=${encodeURIComponent(cleanTopic)}&question_count=5`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true'
      }
    });
    if (!response.ok) return null;
    return (await response.json()) as GeneratedQuiz;
  } catch {
    return null;
  }
}

export async function checkQuizAnswer(
  payload: CheckQuizAnswerPayload
): Promise<CheckQuizAnswerResponse | null> {
  const base = getQuizBaseUrl();
  const url = `${base}/ai/quiz/check/`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) return null;
    return (await response.json()) as CheckQuizAnswerResponse;
  } catch {
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
// Module content / slides
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

export function getModuleRoutePath(moduleId: string): string | null {
  const parsed = parseModuleId(moduleId);
  if (
    typeof parsed.subjectIndex === 'number' &&
    typeof parsed.unitIndex === 'number' &&
    typeof parsed.lessonIndex === 'number'
  ) {
    return `${parsed.subjectIndex}/${parsed.unitIndex}/${parsed.lessonIndex}`;
  }
  return null;
}

export function buildModuleIdFromRoute(
  curriculum: CurriculumResponse | null,
  subjectIndex: string,
  unitIndex: string,
  lessonIndex: string
): string {
  const subjectIdx = Number(subjectIndex);
  const unitIdx = Number(unitIndex);
  const lessonIdx = Number(lessonIndex);
  const subject = curriculum?.result?.subjects?.[subjectIdx];
  const unit = subject?.units?.[unitIdx];
  const lesson = unit?.lessons?.[lessonIdx];

  return JSON.stringify({
    subject: subject?.subject || '',
    unitTitle: unit?.unit_title || '',
    lessonTitle: lesson?.lesson_title || '',
    subjectIndex: subjectIdx,
    unitIndex: unitIdx,
    lessonIndex: lessonIdx,
  });
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

export function getModuleContentFromSavedCurriculum(moduleId: string): ModuleContentResponse | null {
  const savedCurriculum = getSavedCurriculum();
  return curriculumToModuleContent(savedCurriculum, moduleId);
}

function buildFlashcardsFromSlides(slides: SlideItem[], moduleId: string): FlashcardItem[] {
  const parsed = parseModuleId(moduleId);
  const lessonTitle = parsed.lessonTitle || 'الدرس';
  const cards: FlashcardItem[] = [];

  const shortenText = (text: string): string => {
    const clean = text.trim().replace(/\s+/g, ' ');
    if (!clean) return '';

    const sentenceMatch = clean.match(/^[^\.؟!?\n]+[\.؟!?]?/);
    const firstSentence = sentenceMatch ? sentenceMatch[0].trim() : clean;
    if (firstSentence.length <= 100) return firstSentence;

    const commaIndex = firstSentence.indexOf('،');
    if (commaIndex > 20) {
      return firstSentence.slice(0, commaIndex).trim();
    }

    return firstSentence.slice(0, 90).trim().replace(/\s+$/, '') + '...';
  };

  for (const slide of slides) {
    if (cards.length >= 6) break;

    const questionText = slide.title
      ? `ما التعريف المختصر ل"${slide.title}"؟`
      : `ما النقطة الرئيسية في هذا الشرح؟`;

    const contentText = shortenText(slide.content || '');
    const keyPointText = Array.isArray(slide.keyPoints) && slide.keyPoints.length > 0
      ? shortenText(slide.keyPoints[0])
      : '';
    const exampleText = shortenText(slide.example || '');

    const answerText = [contentText, keyPointText, exampleText]
      .filter(Boolean)
      .shift() || '';

    if (!answerText) continue;

    cards.push({
      front: questionText,
      back: answerText,
    });
  }

  return cards;
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