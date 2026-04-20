import { BookOpen, TrendingUp, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
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

interface HomeTabProps {
  user: User;
  studyPlans: StudyPlan[];
  curriculum: any;
  onCreateNewPlan: () => void;
  onOpenPlan: (planId: string) => void;
  onDeletePlan: (planId: string) => void;
}

export function HomeTab({ user, studyPlans, curriculum, onCreateNewPlan, onOpenPlan, onDeletePlan }: HomeTabProps) {
  const activePlans = studyPlans.filter(p => p.status === 'in-progress');
  const completedPlans = studyPlans.filter(p => p.status === 'completed');
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const getTotalLessons = (curr: any): number => {
    if (!curr) return 24;
    const subjects = curr?.result?.subjects || curr?.subjects || [];
    return subjects.reduce((total: number, subject: any) => {
      const units = subject.units || [];
      return total + units.reduce((unitTotal: number, unit: any) => {
        return unitTotal + (unit.lessons || []).length;
      }, 0);
    }, 0) || 24;
  };

  // Calculate how many UNITS have been fully or partially completed
  const getCompletedAndTotalUnits = (plan: StudyPlan, curr: any): { completed: number; total: number } => {
    if (!curr) return { completed: 0, total: 0 };
    const subjects = curr?.result?.subjects || curr?.subjects || [];

    let totalUnits = 0;
    let completedUnits = 0;

    subjects.forEach((subject: any, subjectIndex: number) => {
      const units = subject.units || [];
      units.forEach((unit: any, unitIndex: number) => {
        totalUnits++;
        const lessons = unit.lessons || [];
        const allLessonsCompleted = lessons.length > 0 && lessons.every((_: any, lessonIndex: number) => {
          const payload = JSON.stringify({
            subject: subject.subject,
            unitTitle: unit.unit_title || `وحدة ${unitIndex + 1}`,
            lessonTitle: lessons[lessonIndex].lesson_title,
            subjectIndex,
            unitIndex,
            lessonIndex,
          });
          return plan.completedModules.includes(payload);
        });
        if (allLessonsCompleted) completedUnits++;
      });
    });

    return { completed: completedUnits, total: totalUnits };
  };

  // Calculate progress based on lessons completed / total lessons
  const getPlanProgress = (plan: StudyPlan, curr: any): number => {
    const total = getTotalLessons(curr);
    if (total === 0) return 0;
    return (plan.completedModules.length / total) * 100;
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* User Welcome */}
      <Card className="p-6 lg:p-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white border-0 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl flex-shrink-0 border-4 border-white/30">
            {user.avatar}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl mb-2">مرحباً بعودتك، {user.name}! 👋</h1>
            <div className="flex flex-wrap gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <span>{user.grade}</span>
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <span>{activePlans.length} خطة نشطة</span>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <span>{completedPlans.length} مكتملة</span>
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Study Plans Section */}
      {studyPlans.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-lg text-gray-700 mb-6">ليس لديك أي خطة دراسية بعد.</p>
          <Button
            onClick={onCreateNewPlan}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            إنشاء خطة جديدة
          </Button>
        </div>
      )}

      {studyPlans.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl mb-2">خططك الدراسية</h2>
              <p className="text-gray-600">إدارة وتتبع مساراتك التعليمية الشخصية</p>
            </div>
            <Button
              onClick={onCreateNewPlan}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              إنشاء خطة جديدة
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {studyPlans.map((plan) => {
              const { completed: completedUnits, total: totalUnits } = getCompletedAndTotalUnits(plan, curriculum);
              const progress = getPlanProgress(plan, curriculum);

              return (
                <Card
                  key={plan.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onOpenPlan(plan.id)}
                >
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <h3 className="text-xl flex-1">{plan.title}</h3>
                      <div className="flex items-center gap-2">
                        <AlertDialog open={deletingPlanId === plan.id} onOpenChange={(open) => {
                          if (!open) setDeletingPlanId(null);
                        }}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingPlanId(plan.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                              حذف
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
                                onClick={() => {
                                  onDeletePlan(plan.id);
                                  setDeletingPlanId(null);
                                }}
                              >
                                حذف
                              </AlertDialogAction>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                        <span className={`text-sm px-3 py-1 rounded-full ${plan.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : plan.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                          }`}>
                          {plan.status === 'not-started' && 'لم تبدأ'}
                          {plan.status === 'in-progress' && 'قيد التقدم'}
                          {plan.status === 'completed' && 'مكتملة'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                        {plan.level === 'beginner' && 'مبتدئ'}
                        {plan.level === 'intermediate' && 'متوسط'}
                        {plan.level === 'advanced' && 'متقدم'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2 text-sm">
                        <span className="text-gray-600">التقدم</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{completedUnits} من {totalUnits} وحدات مكتملة</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}