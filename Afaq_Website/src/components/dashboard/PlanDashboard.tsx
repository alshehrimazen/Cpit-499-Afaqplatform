import { useMemo, useState } from 'react';
import {
  Menu,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { getSavedCurriculum } from '../../services/aiApi';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogAction,
} from '../ui/alert-dialog';
import type { User, StudyPlan } from '../../App';

interface PlanDashboardProps {
  user: User;
  plan: StudyPlan;
  curriculumData: any;
  onStartModule: (moduleId: string) => void;
  onNavigate: (page: string) => void;
  onBack: () => void;
  onToggleSidebar: () => void;
  onDeletePlan: (planId: string) => void;
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

const subjectStyleMap: Record<string, { icon: string; color: string }> = {
  رياضيات: { icon: '📐', color: 'from-blue-500 to-blue-600' },
  فيزياء: { icon: '⚛️', color: 'from-purple-500 to-pink-600' },
  كيمياء: { icon: '🧪', color: 'from-green-500 to-green-600' },
  أحياء: { icon: '🧬', color: 'from-yellow-500 to-pink-600' },
};

function normalizeArabicSubjectName(value: string): string {
  return (value || '').trim().replace(/^ال/, '');
}

function estimateLessonDuration(slidesCount: number): string {
  const minutes = Math.max(15, slidesCount * 10);
  return `${minutes} دقيقة`;
}

function buildSubjectsFromCurriculum(plan: StudyPlan, curriculum: any): Subject[] {
  const rawSubjects = curriculum?.result?.subjects || curriculum?.subjects;

  if (!rawSubjects || !Array.isArray(rawSubjects)) {
    return [];
  }

  return rawSubjects.map((subject: any, subjectIndex: number) => {
    const normalizedName = normalizeArabicSubjectName(subject.subject);
    const style = subjectStyleMap[normalizedName] || { icon: '📘', color: 'from-gray-500 to-gray-600' };

    const modules: Module[] = (subject.units || []).map((unit: any, unitIndex: number) => {
      const lessons: Lesson[] = (unit.lessons || []).map((lesson: any, lessonIndex: number) => {
        const payload = JSON.stringify({
          subject: subject.subject,
          unitTitle: unit.unit_title || `وحدة ${unitIndex + 1}`,
          lessonTitle: lesson.lesson_title,
          subjectIndex,
          unitIndex,
          lessonIndex,
        });

        const isCompleted = plan.completedModules.includes(payload);

        return {
          id: payload,
          title: lesson.lesson_title,
          duration: estimateLessonDuration(lesson.slides?.length || 0),
          status: isCompleted ? 'completed' : 'not-started',
        };
      });

      return {
        id: `${subject.subject}-unit-${unitIndex}`,
        name: unit.unit_title || `وحدة ${unitIndex + 1}`,
        description: `تحتوي على ${lessons.length} دروس`,
        lessons,
      };
    });

    return {
      id: `subject-${subjectIndex}-${subject.subject}`,
      name: subject.subject,
      icon: style.icon,
      color: style.color,
      modules,
    };
  });
}

export function PlanDashboard({
  user,
  plan,
  curriculumData,
  onStartModule,
  onNavigate,
  onBack,
  onToggleSidebar,
  onDeletePlan,
}: PlanDashboardProps) {
  const curriculum = curriculumData || getSavedCurriculum();
  const subjects = useMemo(() => buildSubjectsFromCurriculum(plan, curriculum), [plan, curriculum]);

  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(subjects.length > 0 ? [subjects[0].id] : [])
  );

  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(subjects[0]?.modules?.[0] ? [subjects[0].modules[0].id] : [])
  );

  const toggleSubject = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    newExpanded.has(subjectId) ? newExpanded.delete(subjectId) : newExpanded.add(subjectId);
    setExpandedSubjects(newExpanded);
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    newExpanded.has(moduleId) ? newExpanded.delete(moduleId) : newExpanded.add(moduleId);
    setExpandedModules(newExpanded);
  };

  const getSubjectProgress = (subject: Subject): number => {
    const totalLessons = subject.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
    const completedLessons = subject.modules.reduce((sum, mod) => sum + mod.lessons.filter((l) => l.status === 'completed').length, 0);
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  };

  const getModuleProgress = (module: Module) => {
    const total = module.lessons.length;
    const completed = module.lessons.filter((l) => l.status === 'completed').length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const totalLessons = subjects.reduce((sum, subject) => sum + subject.modules.reduce((modSum, mod) => modSum + mod.lessons.length, 0), 0);
  const completedLessons = subjects.reduce((sum, subject) => sum + subject.modules.reduce((modSum, mod) => modSum + mod.lessons.filter((l) => l.status === 'completed').length, 0), 0);
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const averageScore = plan.completedModules.length > 0 ? Object.values(plan.quizScores).reduce((a, b) => a + b, 0) / plan.completedModules.length : 0;

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center gap-3">
          <button onClick={onToggleSidebar} className="lg:hidden"><Menu className="w-6 h-6" /></button>
          <button onClick={onBack}><ArrowLeft className="w-6 h-6 rotate-180" /></button>
          <h1 className="text-xl lg:text-2xl flex-1">{plan.title}</h1>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4" />
                حذف الخطة
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl" className="flex flex-col items-center">
              <AlertDialogHeader className="w-full text-center">
                <AlertDialogTitle className="text-center">تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription className="text-center">
                  هل أنت متأكد أنك تريد حذف هذه الخطة؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-center gap-3 w-full">
                <AlertDialogAction
                  className="bg-destructive text-white"
                  onClick={() => onDeletePlan(plan.id)}
                >
                  حذف
                </AlertDialogAction>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl mb-2">{plan.title}</h2>
          <p className="text-lg opacity-90 mb-4">منهج المستوى {plan.level}</p>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span>التقدم الإجمالي</span>
              <span>{overallProgress.toFixed(0)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3 bg-white/30" />
            <p className="text-sm mt-2 opacity-90">{completedLessons} من {totalLessons} درس مكتمل</p>
          </div>
        </div>

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
            <p className="text-3xl mb-1">{subjects.length}</p>
            <p className="text-sm text-gray-600">مواد أساسية</p>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl mb-4">المنهج الدراسي</h2>

          {subjects.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-gray-600 font-bold">لا يوجد منهج محفوظ حالياً. أعد التقييم التشخيصي أولاً.</p>
            </Card>
          )}

          {subjects.map((subject) => {
            const subjectProgress = getSubjectProgress(subject);
            const isExpanded = expandedSubjects.has(subject.id);

            return (
              <Card key={subject.id} className="overflow-hidden">
                <button onClick={() => toggleSubject(subject.id)} className="w-full p-6 text-right hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${subject.color} rounded-xl flex items-center justify-center text-3xl flex-shrink-0`}>{subject.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl">{subject.name}</h3>
                        {isExpanded ? <ChevronDown className="w-6 h-6 text-gray-400" /> : <ChevronRight className="w-6 h-6 text-gray-400 rotate-180" />}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1"><span className="text-sm text-gray-600">تقدم المادة</span><span className="text-sm">{subjectProgress.toFixed(0)}%</span></div>
                          <Progress value={subjectProgress} className="h-2" />
                        </div>
                        <span className="text-sm text-gray-600">{subject.modules.length} وحدات</span>
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-gray-50/50 p-4 space-y-3">
                    {subject.modules.map((module) => {
                      const moduleProgress = getModuleProgress(module);
                      const isModuleExpanded = expandedModules.has(module.id);

                      return (
                        <Card key={module.id} className="bg-white">
                          <button onClick={() => toggleModule(module.id)} className="w-full p-4 text-right hover:bg-gray-50">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mt-1"><BookOpen className="w-5 h-5 text-gray-600" /></div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between mb-1"><h4 className="text-lg">{module.name}</h4>{isModuleExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />}</div>
                                <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                                <div>
                                  <div className="flex justify-between mb-1"><span className="text-sm text-gray-600">{moduleProgress.completed}/{moduleProgress.total} دروس</span><span className="text-sm">{moduleProgress.percentage.toFixed(0)}%</span></div>
                                  <Progress value={moduleProgress.percentage} className="h-1.5" />
                                </div>
                              </div>
                            </div>
                          </button>

                          {isModuleExpanded && (
                            <div className="border-t bg-gray-50/50 px-4 py-3 space-y-2">
                              {module.lessons.map((lesson) => (
                                <div key={lesson.id} className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${lesson.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    {lesson.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <BookOpen className="w-4 h-4 text-gray-400" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-sm mb-1">{lesson.title}</h5>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.duration}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <Button size="sm" onClick={() => onStartModule(lesson.id)} className={lesson.status === 'completed' ? "bg-gray-100 text-gray-800" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white"}>
                                      {lesson.status === 'completed' ? <><RotateCcw className="w-4 h-4 mr-1" /> مراجعة</> : <><Play className="w-4 h-4 mr-1" /> ابدأ</>}
                                    </Button>
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
      </div>
    </div>
  );
}