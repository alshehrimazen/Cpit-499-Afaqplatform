import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
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
import { getSavedCurriculum, getModuleRoutePath, buildModuleIdFromRoute } from './services/aiApi';
import { FinalExam } from './components/exam/FinalExam';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { Sidebar } from './components/layout/Sidebar';
import type { User, StudyPlan } from './App';

interface AppRouterProps {
  user: User | null;
  studyPlans: StudyPlan[];
  curriculumProp: any; // استقبال بيانات المنهج من ملف App.tsx
  diagnosticLevel: string;
  onLogin: (email: string, password: string, isGuest?: boolean) => Promise<void>;
  onSignup: (name: string, email: string, password: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onDiagnosticComplete: (level: string) => void;
  onPreferencesComplete: (preferences: StudyPreferencesData) => Promise<void>;
  onQuizComplete: (moduleId: string, score: number, currentPlanId: string, currentPlans: StudyPlan[]) => Promise<void>;
}

export default function AppRouter({
  user,
  studyPlans,
  curriculumProp,
  diagnosticLevel,
  onLogin,
  onSignup,
  onLogout,
  onDiagnosticComplete,
  onPreferencesComplete,
  onQuizComplete,
}: AppRouterProps) {
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    if (!currentPlanId) {
      const savedPlanId = localStorage.getItem('afaq_current_plan_id');
      if (savedPlanId) {
        setCurrentPlanId(savedPlanId);
      }
    }

    if (params.subjectIndex && params.unitIndex && params.lessonIndex) {
      const currentCurriculum = curriculumProp || getSavedCurriculum();
      const moduleId = buildModuleIdFromRoute(currentCurriculum, params.subjectIndex, params.unitIndex, params.lessonIndex);
      setCurrentModule(moduleId);
    }
  }, [currentPlanId, params.subjectIndex, params.unitIndex, params.lessonIndex, curriculumProp]);

  const StudyRoute = () => {
    const routeParams = useParams();
    const moduleId = currentModule || (routeParams.subjectIndex && routeParams.unitIndex && routeParams.lessonIndex
      ? buildModuleIdFromRoute(curriculumProp || getSavedCurriculum(), routeParams.subjectIndex, routeParams.unitIndex, routeParams.lessonIndex)
      : '');

    return user ? (
      <StudyModule
        moduleId={moduleId}
        onComplete={(moduleId) => {
          setCurrentModule(moduleId);
          const routePath = getModuleRoutePath(moduleId);
          if (currentPlanId) {
            navigate(routePath ? `/plan/flashcards/${routePath}` : `/plan/flashcards/${encodeURIComponent(moduleId)}`);
          }
        }}
        onBack={() => navigate(currentPlanId ? '/plan' : '/home')}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    ) : <Navigate to="/login" replace />;
  };

  const FlashcardsRoute = () => {
    const routeParams = useParams();
    const moduleId = currentModule || (routeParams.subjectIndex && routeParams.unitIndex && routeParams.lessonIndex
      ? buildModuleIdFromRoute(curriculumProp || getSavedCurriculum(), routeParams.subjectIndex, routeParams.unitIndex, routeParams.lessonIndex)
      : '');

    return user ? (
      <LessonFlashcards
        moduleId={moduleId}
        onComplete={() => {
          const routePath = getModuleRoutePath(moduleId);
          if (currentPlanId) {
            navigate(routePath ? `/plan/quiz/${routePath}` : `/plan/quiz/${encodeURIComponent(moduleId)}`);
          }
        }}
        onBack={() => {
          const routePath = getModuleRoutePath(moduleId);
          navigate(routePath ? `/plan/study/${routePath}` : `/plan`);
        }}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    ) : <Navigate to="/login" replace />;
  };

  const QuizRoute = () => {
    const routeParams = useParams();
    const moduleId = currentModule || (routeParams.subjectIndex && routeParams.unitIndex && routeParams.lessonIndex
      ? buildModuleIdFromRoute(curriculumProp || getSavedCurriculum(), routeParams.subjectIndex, routeParams.unitIndex, routeParams.lessonIndex)
      : '');

    return user ? (
      <QuizInterface
        moduleId={moduleId}
        onComplete={(moduleId, score) => {
          if (!currentPlanId) return;
          onQuizComplete(moduleId, score, currentPlanId, studyPlans);
          navigate('/plan');
        }}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
    ) : <Navigate to="/login" replace />;
  };

  const activePlanId = currentPlanId || localStorage.getItem('afaq_current_plan_id');
  const showSidebar = user && !['/landing', '/login', '/signup', '/diagnostic', '/preferences'].includes(location.pathname);
  const currentPlan = studyPlans.find(p => p.id === activePlanId);

  const handleLogin = async (email: string, password: string, isGuest = false) => {
    try {
      await onLogin(email, password, isGuest);
      navigate('/home');
    } catch (e) {
      console.error("Login failed", e);
      throw e;
    }
  };

  const handleDiagnosticComplete = (level: string) => {
    onDiagnosticComplete(level);
    navigate('/preferences');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" dir="rtl">
      {showSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPage={location.pathname}
          user={user}
          onLogout={async () => { await onLogout(); navigate('/landing'); }}
          studyPlans={studyPlans}
        />
      )}

      <div className={showSidebar ? 'lg:pr-64' : ''}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={user ? <Navigate to="/home" replace /> : <SignupPage onSignup={async (n, e, p) => { await onSignup(n, e, p); navigate('/home'); }} />} />

          <Route
            path="/home"
            element={user ? (
              <PersonalizedHome
                user={user}
                studyPlans={studyPlans}
                onCreateNewPlan={() => navigate('/diagnostic')}
                onOpenPlan={(planId) => {
                  setCurrentPlanId(planId);
                  localStorage.setItem('afaq_current_plan_id', planId);
                  navigate('/plan');
                }}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              />
            ) : <Navigate to="/login" replace />}
          />

          <Route
            path="/plan"
            element={user && currentPlan ? (
              <PlanDashboard
                user={user}
                plan={currentPlan}
                curriculumData={curriculumProp} // تمرير المنهج من الـ props
                onStartModule={(moduleId) => {
                  setCurrentModule(moduleId);
                  const routePath = getModuleRoutePath(moduleId);
                  if (currentPlanId) {
                    navigate(routePath ? `/plan/study/${routePath}` : `/plan/study/${encodeURIComponent(moduleId)}`);
                  }
                }}
                onNavigate={(path) => navigate(path)}
                onBack={() => navigate('/home')}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              />
            ) : user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />}
          />

          <Route path="/plan/study/:subjectIndex/:unitIndex/:lessonIndex" element={<StudyRoute />} />
          <Route path="/plan/flashcards/:subjectIndex/:unitIndex/:lessonIndex" element={<FlashcardsRoute />} />

          <Route path="/diagnostic" element={user ? <DiagnosticTest onComplete={handleDiagnosticComplete} userName={user.name} onCancel={() => navigate('/home')} /> : <Navigate to="/login" replace />} />
          <Route path="/preferences" element={user ? <StudyPreferences userName={user.name} diagnosticLevel={diagnosticLevel} onComplete={async (p) => { await onPreferencesComplete(p); navigate('/home'); }} onCancel={() => navigate('/home')} /> : <Navigate to="/login" replace />} />

          <Route path="/plan/quiz/:subjectIndex/:unitIndex/:lessonIndex" element={<QuizRoute />} />

          {/* مسارات إضافية مماثلة... */}
          <Route path="/friends" element={user ? <Friends user={user} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}