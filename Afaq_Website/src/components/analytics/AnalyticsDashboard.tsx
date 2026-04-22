import { Menu, TrendingUp, Award, Target, Zap, Calendar, BookOpen, Trophy, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import type { User, StudyPlan } from '../../App';
import { getSavedCurriculum } from '../../services/aiApi';

interface AnalyticsDashboardProps {
  user: User;
  plan: StudyPlan;
  onNavigate: (page: string) => void;
  onToggleSidebar: () => void;
  hideHeader?: boolean;
}

export function AnalyticsDashboard({ user, plan, onNavigate, onToggleSidebar, hideHeader }: AnalyticsDashboardProps) {
  const scores = Object.values(plan.quizScores || {});
  const averageScore = scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length 
    : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  const totalLessons = (() => {
    const curriculum: any = getSavedCurriculum();
    const subjects = curriculum?.result?.subjects || curriculum?.subjects || [];
    return subjects.reduce((sum: number, subject: any) => {
      const units = subject?.units || [];
      return sum + units.reduce((unitSum: number, unit: any) => unitSum + ((unit?.lessons || []).length), 0);
    }, 0);
  })();

  const completedLessons = plan.completedModules?.length || 0;
  const completionPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const parseModuleId = (moduleId: string): { subject?: string; unitTitle?: string; lessonTitle?: string } => {
    try {
      const parsed = JSON.parse(moduleId);
      if (parsed && typeof parsed === 'object') {
        return {
          subject: parsed.subject || '',
          unitTitle: parsed.unitTitle || '',
          lessonTitle: parsed.lessonTitle || '',
        };
      }
      return { lessonTitle: moduleId };
    } catch {
      return { lessonTitle: moduleId };
    }
  };

  const subjectScores = (() => {
    const subjectAgg = new Map<string, { total: number; count: number }>();
    for (const [moduleId, score] of Object.entries(plan.quizScores || {})) {
      const { subject } = parseModuleId(moduleId);
      const key = (subject || 'مواد أخرى').trim() || 'مواد أخرى';
      const existing = subjectAgg.get(key) || { total: 0, count: 0 };
      subjectAgg.set(key, { total: existing.total + (Number(score) || 0), count: existing.count + 1 });
    }

    const items = Array.from(subjectAgg.entries())
      .map(([subject, v]) => ({
        subject,
        score: v.count > 0 ? v.total / v.count : 0,
      }))
      .sort((a, b) => b.score - a.score);

    return items.length > 0 ? items : [{ subject: 'لا توجد بيانات بعد', score: 0 }];
  })();

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 75) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 60) return { label: 'Fair', color: 'text-orange-600' };
    return { label: 'Needs Improvement', color: 'text-red-600' };
  };

  return (
    <div className={hideHeader ? '' : 'min-h-screen'}>
      {!hideHeader && (
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="px-4 py-4 flex items-center justify-between">
            <button onClick={onToggleSidebar} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl">لوحة التحليلات</h1>
          </div>
        </header>
      )}

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Overview Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl mb-4">تحليلات التعلم الخاصة بك</h2>
          <p className="text-lg opacity-90">تتبع تقدمك، حدد نقاط قوتك، وخطط لخطواتك التالية</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700">نسبة الإنجاز</span>
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-4xl mb-2">{completionPercentage.toFixed(0)}%</p>
            <Progress value={completionPercentage} className="h-2 mb-2" />
            <p className="text-sm text-gray-600">
              {completedLessons}/{totalLessons || '—'} درس مكتمل
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700">متوسط الدرجة</span>
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-4xl mb-2">{averageScore.toFixed(0)}%</p>
            <p className={`text-sm ${getPerformanceLevel(averageScore).color}`}>
              {getPerformanceLevel(averageScore).label === 'Excellent' ? 'ممتاز' : 
               getPerformanceLevel(averageScore).label === 'Good' ? 'جيد' : 
               getPerformanceLevel(averageScore).label === 'Fair' ? 'مقبول' : 'يحتاج تحسين'}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700">الدروس</span>
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-4xl mb-2">{completedLessons}</p>
            <p className="text-sm text-gray-600">مكتملة</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-700">المستوى</span>
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-3xl mb-2 capitalize">{plan.level === 'beginner' ? 'مبتدئ' : plan.level === 'intermediate' ? 'متوسط' : 'متقدم'}</p>
            <p className="text-sm text-gray-600">المستوى الحالي</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Subject Performance */}
          <Card className="p-6">
            <h3 className="text-2xl mb-6">الأداء حسب المادة</h3>
            <div className="space-y-4">
              {subjectScores.map((item) => (
                <div key={item.subject}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">{item.subject}</span>
                    <span className={item.score > 0 ? '' : 'text-gray-400'}>
                      {item.score > 0 ? `${item.score.toFixed(0)}%` : 'لم تبدأ بعد'}
                    </span>
                  </div>
                  <Progress 
                    value={item.score} 
                    className={`h-3 ${item.score === 0 ? 'opacity-30' : ''}`}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Score Distribution */}
          <Card className="p-6">
            <h3 className="text-2xl mb-6">ملخص الدرجات</h3>
            {scores.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">الأعلى</p>
                    <p className="text-3xl text-green-600">{highestScore}%</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">المتوسط</p>
                    <p className="text-3xl text-blue-600">{averageScore.toFixed(0)}%</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">الأقل</p>
                    <p className="text-3xl text-orange-600">{lowestScore}%</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-900">تقييم الأداء</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i < Math.floor(averageScore / 20)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>أكمل الدروس لعرض توزيع الدرجات</p>
              </div>
            )}
          </Card>
        </div>

        {/* Progress Timeline */}
        <Card className="p-6">
          <h3 className="text-2xl mb-6">الخط الزمني للتعلم</h3>
          {plan.completedModules.length > 0 ? (
            <div className="space-y-4">
              {plan.completedModules.map((moduleId, index) => {
                const score = plan.quizScores[moduleId];
                const meta = parseModuleId(moduleId);
                const title = meta.lessonTitle || meta.unitTitle || meta.subject || 'درس';
                
                return (
                  <div key={moduleId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{title}</p>
                      <p className="text-sm text-gray-600">
                        {meta.subject ? `${meta.subject} • ` : ''}
                        {typeof score === 'number' ? `تم الإكمال بدرجة ${score}%` : 'تم الإكمال'}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      (score ?? 0) >= 80 
                        ? 'bg-green-100 text-green-700' 
                        : (score ?? 0) >= 60 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {(score ?? 0) >= 80 ? 'ممتاز' : (score ?? 0) >= 60 ? 'جيد' : 'مقبول'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ستظهر الدروس المكتملة هنا</p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}