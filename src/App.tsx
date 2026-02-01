import { useState } from 'react';
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

type Page = 
  | 'landing' 
  | 'login' 
  | 'signup' 
  | 'diagnostic'
  | 'preferences'
  | 'home'
  | 'friends'
  | 'plan'
  | 'study' 
  | 'flashcards'
  | 'quiz' 
  | 'final-exam' 
  | 'analytics';

interface User {
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

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creatingNewPlan, setCreatingNewPlan] = useState(false);
  const [diagnosticLevel, setDiagnosticLevel] = useState<string>('');

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
    
    // Simulate existing user with some plans
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
    setCurrentPage('home');
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
    setCurrentPage('home');
  };

  const handleCreateNewPlan = () => {
    setCreatingNewPlan(true);
    setCurrentPage('diagnostic');
  };

  const handleDiagnosticComplete = (level: string) => {
    // Store the diagnostic level and go to preferences
    setDiagnosticLevel(level);
    setCurrentPage('preferences');
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
    setCreatingNewPlan(false);
    setDiagnosticLevel('');
    setCurrentPage('home');
  };

  const handleOpenPlan = (planId: string) => {
    setCurrentPlanId(planId);
    setCurrentPage('plan');
  };

  const handleStartModule = (moduleId: string) => {
    setCurrentModule(moduleId);
    setCurrentPage('study');
  };

  const handleModuleComplete = (moduleId: string) => {
    // When module is completed, go to flashcards first
    setCurrentPage('flashcards');
  };

  const handleFlashcardsComplete = () => {
    // After flashcards, go to quiz
    if (currentModule) {
      setCurrentQuiz(currentModule);
      setCurrentPage('quiz');
    }
  };

  const handleQuizComplete = (moduleId: string, score: number) => {
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

    setCurrentQuiz(null);
    setCurrentPage('plan');
  };

  const handleLogout = () => {
    setUser(null);
    setStudyPlans([]);
    setCurrentPlanId(null);
    setCurrentPage('landing');
  };

  const currentPlan = studyPlans.find(p => p.id === currentPlanId);

  const showSidebar = user && currentPage !== 'landing' && currentPage !== 'login' && currentPage !== 'signup' && currentPage !== 'diagnostic' && currentPage !== 'preferences';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" dir="rtl">
      {showSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          user={user}
          onLogout={handleLogout}
          studyPlans={studyPlans}
        />
      )}
      
      <div className={showSidebar ? 'lg:pr-64' : ''}>
        {currentPage === 'landing' && (
          <LandingPage onNavigate={setCurrentPage} />
        )}
        
        {currentPage === 'login' && (
          <LoginPage onLogin={handleLogin} onNavigate={setCurrentPage} />
        )}
        
        {currentPage === 'signup' && (
          <SignupPage onSignup={handleSignup} onNavigate={setCurrentPage} />
        )}
        
        {currentPage === 'diagnostic' && user && (
          <DiagnosticTest 
            onComplete={handleDiagnosticComplete} 
            userName={user.name}
            onCancel={() => setCurrentPage('home')}
          />
        )}
        
        {currentPage === 'preferences' && user && (
          <StudyPreferences
            userName={user.name}
            diagnosticLevel={diagnosticLevel}
            onComplete={handlePreferencesComplete}
            onCancel={() => setCurrentPage('home')}
          />
        )}
        
        {currentPage === 'home' && user && (
          <PersonalizedHome
            user={user}
            studyPlans={studyPlans}
            onCreateNewPlan={handleCreateNewPlan}
            onOpenPlan={handleOpenPlan}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        
        {currentPage === 'friends' && user && (
          <Friends
            user={user}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        
        {currentPage === 'plan' && user && currentPlan && (
          <PlanDashboard
            user={user}
            plan={currentPlan}
            onStartModule={handleStartModule}
            onNavigate={setCurrentPage}
            onBack={() => setCurrentPage('home')}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        
        {currentPage === 'study' && currentModule && (
          <StudyModule
            moduleId={currentModule}
            onComplete={handleModuleComplete}
            onBack={() => setCurrentPage('plan')}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        
        {currentPage === 'flashcards' && currentModule && (
          <LessonFlashcards
            moduleId={currentModule}
            onComplete={handleFlashcardsComplete}
            onBack={() => setCurrentPage('plan')}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        
        {currentPage === 'quiz' && currentQuiz && (
          <QuizInterface
            moduleId={currentQuiz}
            onComplete={handleQuizComplete}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        
        {currentPage === 'final-exam' && currentPlan && (
          <FinalExam
            plan={currentPlan}
            onComplete={() => setCurrentPage('analytics')}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
        
        {currentPage === 'analytics' && user && currentPlan && (
          <AnalyticsDashboard
            user={user}
            plan={currentPlan}
            onNavigate={setCurrentPage}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}
      </div>
    </div>
  );
}