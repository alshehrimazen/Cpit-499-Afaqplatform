import { useState } from 'react';
import { Menu, ArrowLeft, ChevronDown, ChevronRight, BookOpen, CheckCircle, Clock, TrendingUp, Award, Play, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import type { User, StudyPlan } from '../../App';

interface PlanDashboardProps {
  user: User;
  plan: StudyPlan;
  onStartModule: (moduleId: string) => void;
  onNavigate: (page: string) => void;
  onBack: () => void;
  onToggleSidebar: () => void;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  status: 'not-started' | 'in-progress' | 'completed';
}

interface Module {
  id: string;
  name: string;
  description: string;
  lessons: Lesson[];
}

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  modules: Module[];
}

// Mock data structure - this would come from your backend/state management
const subjects: Subject[] = [
  {
    id: 'math',
    name: 'الرياضيات',
    icon: '📐',
    color: 'from-blue-500 to-blue-600',
    modules: [
      {
        id: 'math-algebra',
        name: 'الجبر',
        description: 'إتقان التعبيرات الجبرية والمعادلات والدوال',
        lessons: [
          { id: 'math-1', title: 'المعادلات التربيعية', duration: '45 دقيقة', status: 'not-started' },
          { id: 'math-2', title: 'الأنظمة الخطية', duration: '40 دقيقة', status: 'not-started' },
          { id: 'math-3', title: 'كثيرات الحدود', duration: '50 دقيقة', status: 'not-started' }
        ]
      },
      {
        id: 'math-geometry',
        name: 'الهندسة',
        description: 'استكشاف الأشكال والزوايا والتفكير المكاني',
        lessons: [
          { id: 'math-4', title: 'المثلثات والزوايا', duration: '35 دقيقة', status: 'not-started' },
          { id: 'math-5', title: 'الدوائر', duration: '40 دقيقة', status: 'not-started' }
        ]
      }
    ]
  },
  {
    id: 'physics',
    name: 'الفيزياء',
    icon: '⚛️',
    color: 'from-purple-500 to-purple-600',
    modules: [
      {
        id: 'physics-mechanics',
        name: 'الميكانيكا',
        description: 'دراسة الحركة والقوى والطاقة',
        lessons: [
          { id: 'physics-1', title: 'قوانين نيوتن', duration: '50 دقيقة', status: 'not-started' },
          { id: 'physics-2', title: 'الشغل والطاقة', duration: '45 دقيقة', status: 'not-started' },
          { id: 'physics-3', title: 'كمية الحركة', duration: '40 دقيقة', status: 'not-started' }
        ]
      },
      {
        id: 'physics-electricity',
        name: 'الكهرباء والمغناطيسية',
        description: 'فهم الدوائر الكهربائية والمجالات المغناطيسية',
        lessons: [
          { id: 'physics-4', title: 'الدوائر الكهربائية', duration: '45 دقيقة', status: 'not-started' },
          { id: 'physics-5', title: 'المغناطيسية', duration: '40 دقيقة', status: 'not-started' }
        ]
      }
    ]
  },
  {
    id: 'chemistry',
    name: 'الكيمياء',
    icon: '🧪',
    color: 'from-green-500 to-green-600',
    modules: [
      {
        id: 'chem-atomic',
        name: 'التركيب الذري',
        description: 'تعلم عن الذرات والعناصر والجدول الدوري',
        lessons: [
          { id: 'chem-1', title: 'النظرية الذرية', duration: '40 دقيقة', status: 'not-started' },
          { id: 'chem-2', title: 'الجدول الدوري', duration: '35 دقيقة', status: 'not-started' }
        ]
      },
      {
        id: 'chem-bonding',
        name: 'الروابط الكيميائية',
        description: 'استكشاف الروابط الأيونية والتساهمية والمعدنية',
        lessons: [
          { id: 'chem-3', title: 'الروابط الأيونية', duration: '40 دقيقة', status: 'not-started' },
          { id: 'chem-4', title: 'الروابط التساهمية', duration: '45 دقيقة', status: 'not-started' }
        ]
      }
    ]
  },
  {
    id: 'biology',
    name: 'الأحياء',
    icon: '🧬',
    color: 'from-pink-500 to-pink-600',
    modules: [
      {
        id: 'bio-cell',
        name: 'علم الخلية',
        description: 'اكتشف وحدات بناء الحياة',
        lessons: [
          { id: 'bio-1', title: 'تركيب الخلية', duration: '45 دقيقة', status: 'not-started' },
          { id: 'bio-2', title: 'انقسام الخلية', duration: '50 دقيقة', status: 'not-started' }
        ]
      },
      {
        id: 'bio-genetics',
        name: 'علم الوراثة',
        description: 'فهم الحمض النووي والجينات والوراثة',
        lessons: [
          { id: 'bio-3', title: 'بنية الحمض النووي', duration: '40 دقيقة', status: 'not-started' },
          { id: 'bio-4', title: 'علم الوراثة المندلية', duration: '45 دقيقة', status: 'not-started' }
        ]
      }
    ]
  }
];

export function PlanDashboard({ user, plan, onStartModule, onNavigate, onBack, onToggleSidebar }: PlanDashboardProps) {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set(['math']));
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['math-algebra']));

  // Update lesson statuses based on plan data
  const getUpdatedSubjects = (): Subject[] => {
    return subjects.map(subject => ({
      ...subject,
      modules: subject.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
          status: plan.completedModules.includes(lesson.id) 
            ? 'completed' as const
            : 'not-started' as const
        }))
      }))
    }));
  };

  const updatedSubjects = getUpdatedSubjects();

  const toggleSubject = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Calculate progress for subjects and modules
  const getSubjectProgress = (subject: Subject): number => {
    const totalLessons = subject.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
    const completedLessons = subject.modules.reduce(
      (sum, mod) => sum + mod.lessons.filter(l => l.status === 'completed').length,
      0
    );
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  };

  const getModuleProgress = (module: Module): { completed: number; total: number; percentage: number } => {
    const total = module.lessons.length;
    const completed = module.lessons.filter(l => l.status === 'completed').length;
    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0
    };
  };

  const totalLessons = updatedSubjects.reduce(
    (sum, subject) => sum + subject.modules.reduce((modSum, mod) => modSum + mod.lessons.length, 0),
    0
  );
  const completedLessons = updatedSubjects.reduce(
    (sum, subject) => sum + subject.modules.reduce(
      (modSum, mod) => modSum + mod.lessons.filter(l => l.status === 'completed').length,
      0
    ),
    0
  );
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const averageScore = plan.completedModules.length > 0
    ? Object.values(plan.quizScores).reduce((a, b) => a + b, 0) / plan.completedModules.length
    : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={onToggleSidebar} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <button onClick={onBack}>
            <ArrowLeft className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="text-xl lg:text-2xl">{plan.title}</h1>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Plan Overview */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl mb-2">{plan.title}</h2>
          <p className="text-lg opacity-90 mb-4">منهج المستوى {plan.level === 'beginner' ? 'المبتدئ' : plan.level === 'intermediate' ? 'المتوسط' : 'المتقدم'}</p>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span>التقدم الإجمالي</span>
              <span>{overallProgress.toFixed(0)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3 bg-white/30" />
            <p className="text-sm mt-2 opacity-90">{completedLessons} من {totalLessons} درس مكتمل</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">التقدم</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl mb-1">{overallProgress.toFixed(0)}%</p>
            <p className="text-sm text-gray-600">{completedLessons}/{totalLessons} درس</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">متوسط النتيجة</span>
              <Award className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl mb-1">{averageScore.toFixed(0)}%</p>
            <p className="text-sm text-gray-600">{averageScore >= 80 ? 'ممتاز!' : 'استمر!'}</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">المواد</span>
              <BookOpen className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl mb-1">{updatedSubjects.length}</p>
            <p className="text-sm text-gray-600">مواد أساسية</p>
          </Card>
        </div>

        {/* Subjects with Modules and Lessons */}
        <div className="space-y-4">
          <h2 className="text-2xl mb-4">المنهج الدراسي</h2>

          {updatedSubjects.map((subject) => {
            const subjectProgress = getSubjectProgress(subject);
            const isExpanded = expandedSubjects.has(subject.id);

            return (
              <Card key={subject.id} className="overflow-hidden">
                {/* Subject Header */}
                <button
                  onClick={() => toggleSubject(subject.id)}
                  className="w-full p-6 text-right hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${subject.color} rounded-xl flex items-center justify-center text-3xl flex-shrink-0`}>
                      {subject.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl">{subject.name}</h3>
                        {isExpanded ? (
                          <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0 rotate-180" />
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">تقدم المادة</span>
                            <span className="text-sm">{subjectProgress.toFixed(0)}%</span>
                          </div>
                          <Progress value={subjectProgress} className="h-2" />
                        </div>
                        <span className="text-sm text-gray-600 flex-shrink-0">
                          {subject.modules.length} وحدات
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Modules (shown when subject is expanded) */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50 p-4 space-y-3">
                    {subject.modules.map((module) => {
                      const moduleProgress = getModuleProgress(module);
                      const isModuleExpanded = expandedModules.has(module.id);

                      return (
                        <Card key={module.id} className="bg-white">
                          {/* Module Header */}
                          <button
                            onClick={() => toggleModule(module.id)}
                            className="w-full p-4 text-right hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                                <BookOpen className="w-5 h-5 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-lg">{module.name}</h4>
                                  {isModuleExpanded ? (
                                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 rotate-180" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm text-gray-600">
                                        {moduleProgress.completed}/{moduleProgress.total} دروس
                                      </span>
                                      <span className="text-sm">{moduleProgress.percentage.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={moduleProgress.percentage} className="h-1.5" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Lessons (shown when module is expanded) */}
                          {isModuleExpanded && (
                            <div className="border-t bg-gray-50/50 px-4 py-3 space-y-2">
                              {module.lessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    lesson.status === 'completed'
                                      ? 'bg-green-100'
                                      : 'bg-gray-100'
                                  }`}>
                                    {lesson.status === 'completed' ? (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <BookOpen className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-sm mb-1">{lesson.title}</h5>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {lesson.duration}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full ${
                                        lesson.status === 'completed'
                                          ? 'bg-green-100 text-green-700'
                                          : lesson.status === 'in-progress'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {lesson.status === 'not-started' ? 'لم يبدأ' : 
                                         lesson.status === 'in-progress' ? 'قيد التقدم' : 'مكتمل'}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    {lesson.status === 'completed' ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onStartModule(lesson.id)}
                                      >
                                        <RotateCcw className="w-4 h-4 mr-1" />
                                        مراجعة
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => onStartModule(lesson.id)}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                      >
                                        <Play className="w-4 h-4 mr-1" />
                                        ابدأ
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Final Exam CTA */}
        {overallProgress === 100 && (
          <Card className="p-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 mt-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl mb-2">جاهز للاختبار النهائي! 🎉</h3>
              <p className="text-gray-600 mb-6">
                لقد أكملت جميع الدروس في جميع المواد. اختبر معرفتك الشاملة في الاختبار النهائي.
              </p>
              <Button
                onClick={() => onNavigate('final-exam')}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                خوض الاختبار النهائي
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
