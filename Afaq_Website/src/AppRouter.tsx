import { useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { DiagnosticTest } from './components/diagnostic/DiagnosticTest';
import { StudyPreferences, StudyPreferencesData } from './components/preferences/StudyPreferences';
import { PersonalizedHome } from './components/PersonalizedHome';
import { Friends } from './components/Friends';
import { PlanDashboard } from './components/dashboard/PlanDashboard';
import { StudyModule } from './components/study/StudyModule';
import { LessonFlashcards } from './components/study/LessonFlashcards';
import { QuizInterface } from './components/quiz/QuizInterface';
import { FinalExam } from './components/exam/FinalExam';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { Sidebar } from './components/layout/Sidebar';

export interface User {
  id: string;
  name: string;
  email: string;
  grade?: string;
  isGuest?: boolean;
  avatar?: string;
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
}

export default function AppRouter() {
  const [user, setUser] = useState<User | null>(null);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [diagnosticLevel, setDiagnosticLevel] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  const showSidebar = user && !['/landing', '/login', '/signup', '/diagnostic', '/preferences'].includes(location.pathname);

  const handleLogin = (email: string, password: string, isGuest = false) => {
    const newUser: User = {
      id: isGuest ? 'guest' : Math.random().toString(36).substr(2, 9),
      name: isGuest ? 'زائر' : email.split('@')[0],
      email: email,
      grade: 'الصف الحادي عشر',
      isGuest: isGuest,
      avatar: isGuest ? 'ز' : email.charAt(0).toUpperCase()
    };
    setUser(newUser);

    const mockPlans: StudyPlan[] = [
      {
        id: 'plan-1',
        title: 'التحضير لاختبار التحصيلي',
        level: 'intermediate',
        status: 'in-progress',
        completionPercentage: 40,
        completedModules: ['math-1', 'physics-1'],
        quizScores: { 'math-1': 85, 'physics-1': 78 },
        createdAt: new Date('2024-01-15')
      }
    ];
    setStudyPlans(mockPlans);
    navigate('/home');
  };

  const handleSignup = (name: string, email: string, password: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      email: email,
      grade: 'الصف الحادي عشر',
      avatar: name.charAt(0).toUpperCase()
    };
    setUser(newUser);
    setStudyPlans([]);
    navigate('/diagnostic');
  };

  const handleDiagnosticComplete = (level: string) => {
    setDiagnosticLevel(level);
    navigate('/preferences');
  };

  const handlePreferencesComplete = (preferences: StudyPreferencesData) => {
    const levelTitles = {
      beginner: 'خطة دراسية للمستوى المبتدئ',
      intermediate: 'خطة دراسية للمستوى المتوسط',
      advanced: 'خطة دراسية للمستوى المتقدم'
    };

    const newPlan: StudyPlan = {
      id: `plan-${Date.now()}`,
      title: levelTitles[diagnosticLevel as keyof typeof levelTitles] || 'خطة دراسية',
      level: diagnosticLevel,
      status: 'not-started',
      completionPercentage: 0,
      completedModules: [],
      quizScores: {},
      createdAt: new Date()
    };

    setStudyPlans([...studyPlans, newPlan]);
    setDiagnosticLevel('');
    navigate('/home');
  };

  const handleLogout = () => {
    setUser(null);
    setStudyPlans([]);
    setCurrentPlanId(null);
    setCurrentModule(null);
    navigate('/landing');
  };

  const currentPlan = studyPlans.find(p => p.id === currentPlanId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" dir="rtl">
      {showSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPage={location.pathname}
          user={user}
          onLogout={handleLogout}
          studyPlans={studyPlans}
        />
      )}

      <div className={showSidebar ? 'lg:pr-64' : ''}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} onNavigate={() => navigate('/signup')} />} />
          <Route path="/signup" element={<SignupPage onSignup={handleSignup} onNavigate={() => navigate('/login')} />} />

          {user && (
            <>
              <Route
                path="/diagnostic"
                element={
                  <DiagnosticTest
                    onComplete={handleDiagnosticComplete}
                    userName={user.name}
                    onCancel={() => navigate('/home')}
                  />
                }
              />
              <Route
                path="/preferences"
                element={
                  <StudyPreferences
                    userName={user.name}
                    diagnosticLevel={diagnosticLevel}
                    onComplete={handlePreferencesComplete}
                    onCancel={() => navigate('/home')}
                  />
                }
              />
              <Route
                path="/home"
                element={
                  <PersonalizedHome
                    user={user}
                    studyPlans={studyPlans}
                    onCreateNewPlan={() => navigate('/diagnostic')}
                    onOpenPlan={(planId) => {
                      setCurrentPlanId(planId);
                      navigate(`/plan/${planId}`);
                    }}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                  />
                }
              />
              <Route
                path="/friends"
                element={
                  <Friends
                    user={user}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                  />
                }
              />
              <Route
                path="/plan/:planId"
                element={
                  currentPlan ? (
                    <PlanDashboard
                      user={user}
                      plan={currentPlan}
                      onStartModule={(moduleId) => {
                        setCurrentModule(moduleId);
                        navigate(`/study/${moduleId}`);
                      }}
                      onNavigate={(path) => navigate(path)}
                      onBack={() => navigate('/home')}
                      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    />
                  ) : null
                }
              />
              <Route
                path="/study/:moduleId"
                element={
                  <StudyModule
                    moduleId={currentModule || ''}
                    onComplete={() => navigate(`/flashcards/${currentModule}`)}
                    onBack={() => navigate(-1)}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                  />
                }
              />
              <Route
                path="/flashcards/:moduleId"
                element={
                  <LessonFlashcards
                    moduleId={currentModule || ''}
                    onComplete={() => navigate(`/quiz/${currentModule}`)}
                    onBack={() => navigate(-1)}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                  />
                }
              />
              <Route
                path="/quiz/:moduleId"
                element={
                  <QuizInterface
                    moduleId={currentModule || ''}
                    onComplete={(moduleId, score) => {
                      if (!currentPlanId) return;
                      setStudyPlans(plans => plans.map(plan => {
                        if (plan.id === currentPlanId) {
                          const updatedModules = [...plan.completedModules];
                          if (!updatedModules.includes(moduleId)) {
                            updatedModules.push(moduleId);
                          }
                          const updatedScores = { ...plan.quizScores, [moduleId]: score };
                          const completionPercentage = (updatedModules.length / 5) * 100;
                          return {
                            ...plan,
                            completedModules: updatedModules,
                            quizScores: updatedScores,
                            completionPercentage,
                            status: completionPercentage === 100 ? 'completed' : 'in-progress'
                          };
                        }
                        return plan;
                      }));
                      navigate(`/plan/${currentPlanId}`);
                    }}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                  />
                }
              />
              <Route
                path="/final-exam/:planId"
                element={
                  currentPlan ? (
                    <FinalExam
                      plan={currentPlan}
                      onComplete={() => navigate(`/analytics/${currentPlanId}`)}
                      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    />
                  ) : null
                }
              />
              <Route
                path="/analytics/:planId"
                element={
                  currentPlan ? (
                    <AnalyticsDashboard
                      user={user}
                      plan={currentPlan}
                      onNavigate={(path) => navigate(path)}
                      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    />
                  ) : null
                }
              />
            </>
          )}
        </Routes>
      </div>
    </div>
  );
}
