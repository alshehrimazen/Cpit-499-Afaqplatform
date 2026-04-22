import React, { useState, useEffect } from 'react';
import AppRouter from './AppRouter';
import {
  auth,
  loginUser,
  signupUser,
  logoutUser,
  getUserData,
  ensureUserData,
  saveProgress,
  saveStudyPlans,
  deleteStudyPlan,
  clearAllPlanData,
  saveCurriculum,
  onAuthStateChanged
} from './lib/firebase';
import { generatePlan, isAiApiConfigured, getSavedCurriculum } from './services/aiApi';
import type { StudyPreferencesData } from './components/preferences/StudyPreferences';

function getTotalUnitsFromCurriculum(curriculum: any): number {
  if (!curriculum) return 5; // fallback
  const subjects = curriculum?.result?.subjects || curriculum?.subjects || [];
  return subjects.reduce((total: number, subject: any) => {
    const units = subject.units || [];
    return total + units.length;
  }, 0) || 5; // fallback to 5 if calculation fails
}

function getTotalLessonsFromCurriculum(curriculum: any): number {
  if (!curriculum) return 24; // fallback
  const subjects = curriculum?.result?.subjects || curriculum?.subjects || [];
  return subjects.reduce((total: number, subject: any) => {
    const units = subject.units || [];
    return total + units.reduce((unitTotal: number, unit: any) => {
      const lessons = unit.lessons || [];
      return unitTotal + lessons.length;
    }, 0);
  }, 0) || 24; // fallback to 24 if calculation fails
}

export interface User {
  id: string;
  name: string;
  email: string;
  grade?: string;
  isGuest?: boolean;
  avatar?: string;
  plan?: string;
}

export interface StudyPlan {
  id: string;
  title: string;
  level: string;
  status: 'in-progress' | 'completed' | 'not-started';
  completionPercentage: number;
  completedModules: string[];
  quizScores: { [key: string]: number };
  createdAt: Date;
  email?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [curriculum, setCurriculum] = useState<any | null>(null);
  const [diagnosticLevel, setDiagnosticLevel] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);

  // Sync state with Firebase on load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const data = await getUserData(firebaseUser.uid);
          if (data) {
            setUser({
              id: firebaseUser.uid,
              name: data.name || 'مستخدم',
              email: data.email || firebaseUser.email || '',
              grade: 'الصف الحادي عشر',
              avatar: data.name?.charAt(0).toUpperCase() || 'U',
              plan: data.plan || 'free',
            });

            if (data.curriculum) {
              setCurriculum(data.curriculum);
              localStorage.setItem('afaq_curriculum', JSON.stringify(data.curriculum));
            } else {
              const saved = getSavedCurriculum();
              if (saved) setCurriculum(saved);
            }

            if (data.studyPlans && Array.isArray(data.studyPlans)) {
              const restored: StudyPlan[] = data.studyPlans.map((p: any) => ({
                ...p,
                createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt),
              }));
              setStudyPlans(restored);
            }
          }
        } catch (e) {
          console.error('Error loading user data:', e);
        }
      } else {
        setUser(null);
        setStudyPlans([]);
        setCurriculum(null);
      }
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogin = async (email: string, password: string, isGuest = false) => {
    if (isGuest) {
      setUser({
        id: 'guest',
        name: 'زائر',
        email: 'guest@afaq.com',
        grade: 'الصف الحادي عشر',
        isGuest: true,
        avatar: 'ز',
        plan: 'free',
      });
      setStudyPlans([]);
      setCurriculum(null);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const firebaseUser = await loginUser(normalizedEmail, password);
    let data = await getUserData(firebaseUser.uid);

    if (!data) {
      await ensureUserData(firebaseUser.uid, firebaseUser.email || normalizedEmail, firebaseUser.displayName || normalizedEmail.split('@')[0]);
      data = await getUserData(firebaseUser.uid);
    }

    setUser({
      id: firebaseUser.uid,
      name: data?.name || firebaseUser.displayName || normalizedEmail.split('@')[0] || 'مستخدم',
      email: data?.email || firebaseUser.email || normalizedEmail,
      grade: 'الصف الحادي عشر',
      avatar: (data?.name || firebaseUser.displayName || normalizedEmail.split('@')[0] || 'مستخدم')?.charAt(0).toUpperCase() || 'U',
      plan: data?.plan || 'free',
    });

    if (data?.curriculum) {
      setCurriculum(data.curriculum);
      localStorage.setItem('afaq_curriculum', JSON.stringify(data.curriculum));
    } else {
      const saved = getSavedCurriculum();
      if (saved) setCurriculum(saved);
    }

    if (data?.studyPlans) {
      setStudyPlans(data.studyPlans.map((p: any) => ({
        ...p,
        createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt),
      })));
    }
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    const firebaseUser = await signupUser(email, password, name);
    setUser({ id: firebaseUser.uid, name, email, grade: 'الصف الحادي عشر', avatar: name.charAt(0).toUpperCase(), plan: 'free' });
  };

  const handleLogout = async () => {
    if (!user?.isGuest) await logoutUser();
    setUser(null);
    setStudyPlans([]);
    localStorage.clear();
  };

  const handlePreferencesComplete = async (preferences: StudyPreferencesData) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const email = auth.currentUser?.email || user?.email || '';

    let newPlans: StudyPlan[] = [];
    let curriculumToSave: any = getSavedCurriculum();

    if (isAiApiConfigured()) {
      try {
        const aiResponse: any = await generatePlan({
          level: diagnosticLevel,
          preferences: {
            dailyStudyTime: preferences.dailyStudyTime,
            studyDuration: preferences.studyDuration,
            studyDays: preferences.studyDays,
            preferredTime: preferences.preferredTime,
            goals: preferences.goals,
            intensity: preferences.intensity,
          },
        });

        if (aiResponse?.result?.subjects && aiResponse.result.subjects.length > 0) {
          curriculumToSave = { result: { subjects: aiResponse.result.subjects } };
          newPlans = [{
            id: `plan-${Date.now()}`,
            title: 'الخطة الدراسية المخصصة',
            level: diagnosticLevel || 'intermediate',
            status: 'not-started',
            completionPercentage: 0,
            completedModules: [],
            quizScores: {},
            createdAt: new Date(),
          }];
        }
      } catch (e) {
        console.error('Plan generation failed:', e);
      }
    }

    if (newPlans.length === 0) {
      newPlans = [{
        id: `plan-${Date.now()}`,
        title: 'الخطة الدراسية المخصصة',
        level: diagnosticLevel || 'intermediate',
        status: 'not-started',
        completionPercentage: 0,
        completedModules: [],
        quizScores: {},
        createdAt: new Date(),
      }];
    }

    const updatedPlans = [...studyPlans, ...newPlans];
    setStudyPlans(updatedPlans);

    if (curriculumToSave) {
      setCurriculum(curriculumToSave);
      localStorage.setItem('afaq_curriculum', JSON.stringify(curriculumToSave));
    }

    try {
      await saveStudyPlans(uid, updatedPlans.map(p => ({
        ...p,
        email,
        createdAt: p.createdAt.toISOString(),
      })), email);

      if (curriculumToSave) {
        await saveCurriculum(uid, curriculumToSave, email);
      }
    } catch (e) {
      console.error('Firebase save failed:', e);
    }

    setDiagnosticLevel('');
  };

  const handleQuizComplete = async (moduleId: string, score: number, currentPlanId: string, currentPlans: StudyPlan[]) => {
    const updatedPlans = currentPlans.map(plan => {
      if (plan.id === currentPlanId) {
        const updatedModules = [...plan.completedModules];
        if (!updatedModules.includes(moduleId)) updatedModules.push(moduleId);
        const updatedScores = { ...plan.quizScores, [moduleId]: score };
        const totalUnits = getTotalUnitsFromCurriculum(curriculum);
        const completionPercentage = (updatedModules.length / totalUnits) * 100;
        return { ...plan, completedModules: updatedModules, quizScores: updatedScores, completionPercentage, status: (completionPercentage === 100 ? 'completed' : 'in-progress') as StudyPlan['status'] };
      }
      return plan;
    });
    setStudyPlans(updatedPlans);

    const uid = auth.currentUser?.uid;
    if (uid) {
      const email = auth.currentUser?.email || user?.email || '';
      const plan = updatedPlans.find(p => p.id === currentPlanId);
      if (plan) {
        await saveProgress(uid, currentPlanId, plan.completedModules, plan.quizScores, email);
        await saveStudyPlans(uid, updatedPlans.map(p => ({ ...p, email, createdAt: p.createdAt.toISOString() })), email);
      }
    }
  };

  const handleDeletePlan = async (planId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const updatedPlans = studyPlans.filter((plan) => plan.id !== planId);
    setStudyPlans(updatedPlans);

    const currentPlanId = localStorage.getItem('afaq_current_plan_id');
    if (currentPlanId === planId) {
      localStorage.removeItem('afaq_current_plan_id');
    }

    try {
      if (updatedPlans.length === 0) {
        setCurriculum(null);
        localStorage.removeItem('afaq_curriculum');
        await clearAllPlanData(uid);
      } else {
        const email = auth.currentUser?.email || user?.email || '';
        await deleteStudyPlan(
          uid,
          planId,
          updatedPlans.map((p) => ({ ...p, email, createdAt: p.createdAt.toISOString() })),
          email
        );
      }
    } catch (e) {
      console.error('Firebase delete failed:', e);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;

  return (
    <AppRouter
      user={user}
      studyPlans={studyPlans}
      curriculumProp={curriculum}
      diagnosticLevel={diagnosticLevel}
      onLogin={handleLogin}
      onSignup={handleSignup}
      onLogout={handleLogout}
      onDiagnosticComplete={(level) => setDiagnosticLevel(level)}
      onPreferencesComplete={handlePreferencesComplete}
      onDeletePlan={handleDeletePlan}
      onQuizComplete={handleQuizComplete}
    />
  );
}