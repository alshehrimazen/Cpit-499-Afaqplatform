/**
 * Application-wide constants for Afaq Platform
 */

// Application Info
export const APP_NAME = 'منصة آفاق';
export const APP_NAME_ENGLISH = 'Afaq Platform';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'منصة دراسية تكيفية مدعومة بالذكاء الاصطناعي لطلاب المرحلة الثانوية وخريجي اختبار التحصيلي';

// Academic Levels
export const ACADEMIC_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
};

export const LEVEL_LABELS = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
};

// Study Status
export const STUDY_STATUS = {
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

export const STATUS_LABELS = {
  'not-started': 'لم يبدأ',
  'in-progress': 'قيد التقدم',
  'completed': 'مكتمل',
};

// Subjects
export const SUBJECTS = {
  MATH: 'math',
  PHYSICS: 'physics',
  CHEMISTRY: 'chemistry',
  BIOLOGY: 'biology',
  ARABIC: 'arabic',
  ENGLISH: 'english',
};

export const SUBJECT_LABELS = {
  math: 'الرياضيات',
  physics: 'الفيزياء',
  chemistry: 'الكيمياء',
  biology: 'الأحياء',
  arabic: 'اللغة العربية',
  english: 'اللغة الإنجليزية',
};

export const SUBJECT_COLORS = {
  math: 'from-blue-500 to-blue-600',
  physics: 'from-purple-500 to-purple-600',
  chemistry: 'from-green-500 to-green-600',
  biology: 'from-emerald-500 to-emerald-600',
  arabic: 'from-pink-500 to-pink-600',
  english: 'from-indigo-500 to-indigo-600',
};

// Study Intensity
export const STUDY_INTENSITY = {
  LIGHT: 'light',
  MODERATE: 'moderate',
  INTENSIVE: 'intensive',
};

export const INTENSITY_LABELS = {
  light: 'خفيف (1-2 ساعة يومياً)',
  moderate: 'متوسط (3-4 ساعات يومياً)',
  intensive: 'مكثف (5+ ساعات يومياً)',
};

// Time Slots
export const TIME_SLOTS = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
};

export const TIME_SLOT_LABELS = {
  morning: 'صباحاً (6-12)',
  afternoon: 'ظهراً (12-6)',
  evening: 'مساءً (6-9)',
  night: 'ليلاً (9-12)',
};

// Study Goals
export const STUDY_GOALS = [
  'اجتياز اختبار التحصيلي',
  'تحسين المستوى الدراسي',
  'التحضير للجامعة',
  'تقوية المواد الضعيفة',
  'الحصول على درجات عالية',
];

// Quiz Settings
export const QUIZ_SETTINGS = {
  MIN_QUESTIONS: 5,
  MAX_QUESTIONS: 20,
  DEFAULT_QUESTIONS: 10,
  PASSING_SCORE: 70,
  TIME_PER_QUESTION: 90, // seconds
};

// Quick Questions Settings
export const QUICK_QUESTION_SETTINGS = {
  SLIDES_BEFORE_QUESTION: 2,
  MIN_SLIDES: 1,
  MAX_SLIDES: 3,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'afaq_user',
  STUDY_PLANS: 'afaq_study_plans',
  CURRENT_PLAN: 'afaq_current_plan',
  PREFERENCES: 'afaq_preferences',
  THEME: 'afaq_theme',
  LANGUAGE: 'afaq_language',
};

// API Endpoints (for future backend integration)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
  },
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE: '/api/user/update',
  },
  STUDY_PLANS: {
    LIST: '/api/plans',
    CREATE: '/api/plans/create',
    UPDATE: '/api/plans/update',
    DELETE: '/api/plans/delete',
  },
  MODULES: {
    LIST: '/api/modules',
    GET: '/api/modules/:id',
  },
  QUIZ: {
    GET: '/api/quiz/:moduleId',
    SUBMIT: '/api/quiz/submit',
  },
};

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
};

// Grades
export const GRADES = [
  'الصف العاشر',
  'الصف الحادي عشر',
  'الصف الثاني عشر',
  'خريج',
];

// Animation Durations (milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 350,
  VERY_SLOW: 500,
};

// Breakpoints (matches Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};

// Toast Messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    LOGIN: 'تم تسجيل الدخول بنجاح',
    SIGNUP: 'تم إنشاء الحساب بنجاح',
    PLAN_CREATED: 'تم إنشاء الخطة الدراسية بنجاح',
    MODULE_COMPLETED: 'تم إكمال الوحدة بنجاح',
    QUIZ_PASSED: 'أحسنت! لقد اجتزت الاختبار',
  },
  ERROR: {
    INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    NETWORK_ERROR: 'خطأ في الاتصال، يرجى المحاولة مرة أخرى',
    GENERIC: 'حدث خطأ ما، يرجى المحاولة مرة أخرى',
  },
  WARNING: {
    INCOMPLETE_FORM: 'يرجى ملء جميع الحقول المطلوبة',
    QUIZ_FAILED: 'لم تجتز الاختبار، حاول مرة أخرى',
  },
};
