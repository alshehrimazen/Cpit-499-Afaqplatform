import {
  TrendingUp,
  Award,
  Target,
  Zap,
  Calendar,
  BookOpen,
  Trophy,
  Star,
  CheckCircle,
} from "lucide-react";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import type { User, StudyPlan } from "../../App";

interface AnalyticsTabProps {
  user: User;
  studyPlans: StudyPlan[];
}

export function AnalyticsTab({
  user,
  studyPlans,
}: AnalyticsTabProps) {
  // Calculate overall stats
  const totalPlans = studyPlans.length;
  const activePlans = studyPlans.filter(
    (p) => p.status === "in-progress",
  ).length;
  const completedPlans = studyPlans.filter(
    (p) => p.status === "completed",
  ).length;

  const allScores = studyPlans.flatMap((p) =>
    Object.values(p.quizScores),
  );
  const averageScore =
    allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;

  const totalModulesCompleted = studyPlans.reduce(
    (sum, p) => sum + p.completedModules.length,
    0,
  );

  const weeklyActivity = [
    { day: "السبت", lessons: 4, time: 60 },
    { day: "الجمعة", lessons: 5, time: 75 },
    { day: "الخميس", lessons: 3, time: 45 },
    { day: "الأربعاء", lessons: 4, time: 60 },
    { day: "الثلاثاء", lessons: 2, time: 30 },
    { day: "الإثنين", lessons: 3, time: 45 },
    { day: "الأحد", lessons: 2, time: 30 },
  ];

  const subjectPerformance = [
    {
      subject: "الرياضيات",
      completed: 8,
      total: 10,
      avgScore: 87,
    },
    {
      subject: "الفيزياء",
      completed: 6,
      total: 10,
      avgScore: 82,
    },
    {
      subject: "الكيمياء",
      completed: 5,
      total: 10,
      avgScore: 90,
    },
    {
      subject: "الإنجليزية",
      completed: 7,
      total: 10,
      avgScore: 85,
    },
    {
      subject: "الأحياء",
      completed: 4,
      total: 10,
      avgScore: 88,
    },
  ];

  const achievements = [
    {
      id: "1",
      title: "الخطوات الأولى",
      description: "أكمل درسك الأول",
      earned: true,
      icon: Star,
    },
    {
      id: "2",
      title: "محارب الأسبوع",
      description: "ادرس لمدة 7 أيام متتالية",
      earned: true,
      icon: Zap,
    },
    {
      id: "3",
      title: "درجة كاملة",
      description: "احصل على 100٪ في اختبار",
      earned: false,
      icon: Trophy,
    },
    {
      id: "4",
      title: "شيطان السرعة",
      description: "أكمل 5 دروس في يوم واحد",
      earned: false,
      icon: TrendingUp,
    },
    {
      id: "5",
      title: "متعلم مخلص",
      description: "أكمل 20 درسًا",
      earned: true,
      icon: Award,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700">إجمالي الخطط</span>
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-4xl mb-1">{totalPlans}</p>
          <p className="text-sm text-gray-600">
            {activePlans} نشطة، {completedPlans} مكتملة
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700">متوسط الدرجة</span>
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-4xl mb-1">
            {averageScore.toFixed(0)}%
          </p>
          <p className="text-sm text-gray-600">
            {averageScore >= 85
              ? "ممتاز!"
              : averageScore >= 70
                ? "عمل جيد!"
                : "استمر في التدريب!"}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700">
              الوحدات المكتملة
            </span>
            <CheckCircle className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-4xl mb-1">
            {totalModulesCompleted}
          </p>
          <p className="text-sm text-gray-600">
            استمر في التعلم!
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700">
              السلسلة الحالية
            </span>
            <Zap className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-4xl mb-1">6</p>
          <p className="text-sm text-gray-600">أيام متتالية</p>
        </Card>
      </div>

      {/* Weekly Activity */}
      <Card className="p-6">
        <h3 className="text-2xl mb-6">النشاط الأسبوعي</h3>
        <div className="grid grid-cols-7 gap-2">
          {weeklyActivity.map((day) => (
            <div key={day.day} className="text-center">
              <div className="mb-2 text-sm text-gray-600">
                {day.day}
              </div>
              <div
                className="bg-gradient-to-t from-blue-600 to-purple-600 rounded-lg mx-auto relative"
                style={{
                  height: `${Math.max(day.lessons * 20, 40)}px`,
                  width: "100%",
                  maxWidth: "80px",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  {day.lessons}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {day.time}د
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Subject Performance */}
        <Card className="p-6">
          <h3 className="text-2xl mb-6">الأداء حسب المادة</h3>
          <div className="space-y-4">
            {subjectPerformance.map((subject) => (
              <div key={subject.subject}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700">
                    {subject.subject}
                  </span>
                  <div className="text-sm text-gray-600">
                    {subject.completed}/{subject.total} •{" "}
                    {subject.avgScore}%
                  </div>
                </div>
                <Progress
                  value={
                    (subject.completed / subject.total) * 100
                  }
                  className="h-3"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Achievements */}
        <Card className="p-6">
          <h3 className="text-2xl mb-6">الإنجازات</h3>
          <div className="space-y-3">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    achievement.earned
                      ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200"
                      : "bg-gray-50 opacity-60"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      achievement.earned
                        ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                        : "bg-gray-400"
                    }`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p
                      className={
                        achievement.earned
                          ? ""
                          : "text-gray-600"
                      }
                    >
                      {achievement.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.earned && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Study Plans Overview */}
      {studyPlans.length > 0 && (
        <Card className="p-6">
          <h3 className="text-2xl mb-6">تقدم الخطط الدراسية</h3>
          <div className="space-y-4">
            {studyPlans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="mb-1">{plan.title}</p>
                    <p className="text-sm text-gray-600 capitalize">
                      مستوى{" "}
                      {plan.level === "beginner"
                        ? "مبتدئ"
                        : plan.level === "intermediate"
                          ? "متوسط"
                          : "متقدم"}
                    </p>
                  </div>
                  <span className="text-2xl">
                    {plan.completionPercentage.toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={plan.completionPercentage}
                  className="h-3"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Study Tips */}
      <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl mb-4">
              نصائح دراسية مخصصة
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
                <span className="text-blue-600 flex-shrink-0">
                  •
                </span>
                <span className="text-gray-700 text-sm">
                  ادرس خلال ساعات ذروة إنتاجيتك
                </span>
              </div>
              <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
                <span className="text-blue-600 flex-shrink-0">
                  •
                </span>
                <span className="text-gray-700 text-sm">
                  خذ استراحات لمدة 5 دقائق كل 25 دقيقة
                </span>
              </div>
              <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
                <span className="text-blue-600 flex-shrink-0">
                  •
                </span>
                <span className="text-gray-700 text-sm">
                  راجع أخطاءك لتتعلم بشكل أسرع
                </span>
              </div>
              <div className="flex items-start gap-2 p-3 bg-white rounded-lg">
                <span className="text-blue-600 flex-shrink-0">
                  •
                </span>
                <span className="text-gray-700 text-sm">
                  تدرب بشكل متسق للحفاظ على سلسلتك
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}