/**
 * API Service for Afaq Platform
 * Handles all HTTP requests (placeholder for future backend integration)
 */

import { API_ENDPOINTS } from '../utils/constants';

/**
 * Base API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Authentication APIs
 */
export const authAPI = {
  login: async (email, password) => {
    // Mock implementation - replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: Math.random().toString(36).substr(2, 9),
            name: email.split('@')[0],
            email,
            grade: 'الصف الحادي عشر',
          },
          token: 'mock-jwt-token',
        });
      }, 1000);
    });
  },

  signup: async (name, email, password) => {
    // Mock implementation - replace with real API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          user: {
            id: Math.random().toString(36).substr(2, 9),
            name,
            email,
            grade: 'الصف الحادي عشر',
          },
          token: 'mock-jwt-token',
        });
      }, 1000);
    });
  },

  logout: async () => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  },
};

/**
 * User APIs
 */
export const userAPI = {
  getProfile: async (userId) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: userId,
          name: 'أحمد محمد',
          email: 'ahmed@example.com',
          grade: 'الصف الثاني عشر',
          avatar: 'أ',
        });
      }, 500);
    });
  },

  updateProfile: async (userId, updates) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: userId,
          name: updates.name || 'أحمد محمد',
          email: updates.email || 'ahmed@example.com',
          grade: updates.grade,
          avatar: updates.avatar,
        });
      }, 500);
    });
  },
};

/**
 * Study Plan APIs
 */
export const studyPlanAPI = {
  getPlans: async (userId) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'plan-1',
            title: 'التحضير لاختبار التحصيلي',
            level: 'intermediate',
            status: 'in-progress',
            completionPercentage: 40,
            completedModules: ['math-1', 'physics-1'],
            quizScores: { 'math-1': 85, 'physics-1': 78 },
            createdAt: new Date('2024-01-15'),
          },
        ]);
      }, 500);
    });
  },

  createPlan: async (plan) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...plan,
          id: `plan-${Date.now()}`,
        });
      }, 500);
    });
  },

  updatePlan: async (planId, updates) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: planId,
          title: updates.title || 'خطة دراسية',
          level: updates.level || 'intermediate',
          status: updates.status || 'not-started',
          completionPercentage: updates.completionPercentage || 0,
          completedModules: updates.completedModules || [],
          quizScores: updates.quizScores || {},
          createdAt: updates.createdAt || new Date(),
        });
      }, 500);
    });
  },

  deletePlan: async (planId) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  },
};

/**
 * Quiz APIs
 */
export const quizAPI = {
  getQuiz: async (moduleId) => {
    // Mock implementation - returns sample questions
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'q1',
            question: 'ما هو ناتج 2 + 2؟',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1,
            explanation: 'الناتج الصحيح هو 4',
          },
          {
            id: 'q2',
            question: 'ما هي عاصمة السعودية؟',
            options: ['جدة', 'الدمام', 'الرياض', 'مكة'],
            correctAnswer: 2,
            explanation: 'الرياض هي عاصمة المملكة العربية السعودية',
          },
        ]);
      }, 500);
    });
  },

  submitQuiz: async (moduleId, answers) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const correctAnswers = answers.filter((a) => a === 1).length;
        const totalQuestions = answers.length;
        const score = Math.round((correctAnswers / totalQuestions) * 100);

        resolve({
          moduleId,
          score,
          totalQuestions,
          correctAnswers,
          timeSpent: 300,
          completedAt: new Date(),
        });
      }, 500);
    });
  },
};

/**
 * Analytics APIs
 */
export const analyticsAPI = {
  getStudyAnalytics: async (userId, planId) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalStudyTime: 1200, // minutes
          averageQuizScore: 78,
          completedModules: 5,
          totalModules: 12,
          streakDays: 7,
          lastStudyDate: new Date(),
          subjectProgress: [
            { subject: 'math', progress: 60, averageScore: 85 },
            { subject: 'physics', progress: 40, averageScore: 78 },
            { subject: 'chemistry', progress: 30, averageScore: 72 },
          ],
        });
      }, 500);
    });
  },
};

/**
 * Diagnostic Test APIs
 */
export const diagnosticAPI = {
  getTest: async () => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'dt1',
            question: 'ما هو ناتج 5 × 7؟',
            options: ['30', '35', '40', '45'],
            correctAnswer: 1,
          },
          {
            id: 'dt2',
            question: 'ما هي وحدة قياس القوة؟',
            options: ['جول', 'نيوتن', 'واط', 'أمبير'],
            correctAnswer: 1,
          },
        ]);
      }, 500);
    });
  },

  submitTest: async (answers) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const correctCount = answers.filter((a) => a === 1).length;
        const score = Math.round((correctCount / answers.length) * 100);
        
        let level;
        if (score >= 80) level = 'advanced';
        else if (score >= 50) level = 'intermediate';
        else level = 'beginner';

        resolve({ level, score });
      }, 1000);
    });
  },
};

export default {
  auth: authAPI,
  user: userAPI,
  studyPlan: studyPlanAPI,
  quiz: quizAPI,
  analytics: analyticsAPI,
  diagnostic: diagnosticAPI,
};
