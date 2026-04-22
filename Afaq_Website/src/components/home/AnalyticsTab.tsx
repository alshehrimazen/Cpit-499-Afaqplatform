import {
  TrendingUp,
  Award,
  Zap,
  BookOpen,
  Trophy,
  Star,
  CheckCircle,
} from "lucide-react";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import type { User, StudyPlan } from "../../App";
import { getSavedCurriculum } from "../../services/aiApi";

interface AnalyticsTabProps {
  user: User;
  studyPlans: StudyPlan[];
}

export function AnalyticsTab({
  user,
  studyPlans,
}: AnalyticsTabProps) {
  const parseModuleId = (moduleId: string): { subject?: string; subjectIndex?: number; unitIndex?: number } => {
    try {
      const parsed = JSON.parse(moduleId);
      if (parsed && typeof parsed === "object") {
        return {
          subject: parsed.subject || "",
          subjectIndex: typeof parsed.subjectIndex === "number" ? parsed.subjectIndex : undefined,
          unitIndex: typeof parsed.unitIndex === "number" ? parsed.unitIndex : undefined,
        };
      }
      return {};
    } catch {
      return {};
    }
  };

  const totalPlans = studyPlans.length;
  const activePlans = studyPlans.filter((p) => p.status === "in-progress").length;
  const completedPlans = studyPlans.filter((p) => p.status === "completed").length;

  const allScores = studyPlans.flatMap((p) => Object.values(p.quizScores));
  const averageScore =
    allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;

  const totalModulesCompleted = studyPlans.reduce(
    (sum, p) => sum + p.completedModules.length,
    0,
  );

  const activePlanId = localStorage.getItem("afaq_current_plan_id");
  const activePlan = studyPlans.find((p) => p.id === activePlanId) || studyPlans[studyPlans.length - 1];

  const curriculum: any = getSavedCurriculum();
  const curriculumSubjects = curriculum?.result?.subjects || curriculum?.subjects || [];

  const totalLessons = curriculumSubjects.reduce((sum: number, subject: any) => {
    const units = subject?.units || [];
    return sum + units.reduce((uSum: number, unit: any) => uSum + ((unit?.lessons || []).length), 0);
  }, 0);

  const activeCompletedLessons = activePlan?.completedModules?.length || 0;

  const { completedUnits, totalUnits } = (() => {
    let total = 0;
    let completed = 0;

    curriculumSubjects.forEach((subject: any, subjectIndex: number) => {
      const units = subject?.units || [];
      units.forEach((unit: any, unitIndex: number) => {
        total++;
        const lessons = unit?.lessons || [];
        const allLessonsCompleted =
          lessons.length > 0 &&
          lessons.every((_: any, lessonIndex: number) => {
            const payload = JSON.stringify({
              subject: subject.subject,
              unitTitle: unit.unit_title || `وحدة ${unitIndex + 1}`,
              lessonTitle: lessons[lessonIndex].lesson_title,
              subjectIndex,
              unitIndex,
              lessonIndex,
            });
            return (activePlan?.completedModules || []).includes(payload);
          });

        if (allLessonsCompleted) completed++;
      });
    });

    return { completedUnits: completed, totalUnits: total };
  })();

  const subjectAgg = (() => {
    const map = new Map<string, { completed: number; scoreTotal: number; scoreCount: number }>();

    for (const plan of studyPlans) {
      for (const moduleId of plan.completedModules || []) {
        const subject = (parseModuleId(moduleId).subject || "مواد أخرى").trim() || "مواد أخرى";
        const existing = map.get(subject) || { completed: 0, scoreTotal: 0, scoreCount: 0 };
        map.set(subject, { ...existing, completed: existing.completed + 1 });
      }

      for (const [moduleId, score] of Object.entries(plan.quizScores || {})) {
        const subject = (parseModuleId(moduleId).subject || "مواد أخرى").trim() || "مواد أخرى";
        const existing = map.get(subject) || { completed: 0, scoreTotal: 0, scoreCount: 0 };
        map.set(subject, {
          ...existing,
          scoreTotal: existing.scoreTotal + (Number(score) || 0),
          scoreCount: existing.scoreCount + 1,
        });
      }
    }

    return Array.from(map.entries())
      .map(([subject, v]) => ({
        subject,
        completed: v.completed,
        avgScore: v.scoreCount > 0 ? v.scoreTotal / v.scoreCount : 0,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  })();

  const hasAnyScore = allScores.length > 0;
  const hasAnyProgress = totalModulesCompleted > 0 || hasAnyScore;

  const achievements = [
    {
      id: "1",
      title: "الخطوات الأولى",
      description: "أكمل أول درس",
      earned: totalModulesCompleted >= 1,
      icon: Star,
    },
    {
      id: "2",
      title: "بداية قوية",
      description: "أكمل 5 دروس",
      earned: totalModulesCompleted >= 5,
      icon: Zap,
    },
    {
      id: "3",
      title: "على الطريق",
      description: "أكمل 10 دروس",
      earned: totalModulesCompleted >= 10,
      icon: CheckCircle,
    },
    {
      id: "4",
      title: "درجة كاملة",
      description: "احصل على 100٪ في اختبار",
      earned: allScores.some((s) => Number(s) === 100),
      icon: Trophy,
    },
    {
      id: "5",
      title: "تفوق",
      description: "احصل على 90٪ أو أكثر في اختبار",
      earned: allScores.some((s) => Number(s) >= 90),
      icon: Award,
    },
    {
      id: "6",
      title: "ثبات الأداء",
      description: "أكمل 3 اختبارات على الأقل",
      earned: Object.keys(studyPlans.reduce((acc: Record<string, number>, p) => ({ ...acc, ...p.quizScores }), {})).length >= 3,
      icon: TrendingUp,
    },
    {
      id: "7",
      title: "متعلم مخلص",
      description: "أكمل 20 درسًا",
      earned: totalModulesCompleted >= 20,
      icon: Award,
    },
    {
      id: "8",
      title: "تحسن مستمر",
      description: "حافظ على متوسط 80٪ أو أكثر",
      earned: hasAnyScore && averageScore >= 80,
      icon: TrendingUp,
    },
  ];

  const streakValue = totalModulesCompleted;

  const subjectProgress = (() => {
    const totals = new Map<string, { total: number; completed: number }>();

    for (const subject of curriculumSubjects) {
      const subjectName = (subject?.subject || "مواد أخرى").trim() || "مواد أخرى";
      const total = (subject?.units || []).reduce((sum: number, unit: any) => sum + ((unit?.lessons || []).length), 0);
      totals.set(subjectName, { total, completed: 0 });
    }

    for (const moduleId of activePlan?.completedModules || []) {
      const subj = (parseModuleId(moduleId).subject || "مواد أخرى").trim() || "مواد أخرى";
      const existing = totals.get(subj) || { total: 0, completed: 0 };
      totals.set(subj, { ...existing, completed: existing.completed + 1 });
    }

    const items = Array.from(totals.entries()).map(([subject, v]) => ({
      subject,
      completed: v.completed,
      total: v.total,
      percent: v.total > 0 ? (v.completed / v.total) * 100 : 0,
    }));

    return items.sort((a, b) => b.percent - a.percent);
  })();

  const tips = [
    "راجع الدروس التي كانت درجتك فيها أقل من 70٪ ثم أعد المحاولة.",
    "خصص وقتاً ثابتاً يومياً (حتى 20-30 دقيقة) لتحافظ على الاستمرارية.",
    "ابدأ بالدرس الأصعب عندما تكون طاقتك أعلى ثم انتقل للأسهل.",
    "بعد كل اختبار، راجع الأخطاء وسجل نقاط الضعف قبل الدرس التالي.",
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

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700">الاستمرارية</span>
            <Zap className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-4xl mb-1">{streakValue}</p>
          <p className="text-sm text-gray-600">دروس مكتملة</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700">تقدم الوحدات</span>
            <CheckCircle className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-4xl mb-1">{totalUnits > 0 ? `${completedUnits}/${totalUnits}` : `${completedUnits}`}</p>
          <Progress value={totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0} className="h-2 mt-2" />
          <p className="text-sm text-gray-600 mt-2">
            {completedUnits} من {totalUnits} وحدات مكتملة
          </p>
        </Card>
      </div>

      {/* Subject Progress + Tips side by side */}
      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        {/* Subject Progress */}
        <Card className="p-6">
          <h3 className="text-2xl mb-6">تقدم المواد</h3>
          <div className="space-y-4">
            {(subjectProgress.length > 0
              ? subjectProgress
              : [{ subject: "لا توجد بيانات بعد", completed: 0, total: 0, percent: 0 }]).map((s) => (
                <div key={s.subject}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">{s.subject}</span>
                    <span className="text-sm text-gray-600">
                      {s.completed}/{s.total || 0} • {s.percent.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={s.percent} className="h-2" />
                </div>
              ))}
          </div>
        </Card>

        {/* Tips */}
        <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 h-full">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl mb-4">نصائح دراسية</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-white rounded-lg">
                    <span className="text-blue-600 flex-shrink-0">•</span>
                    <span className="text-gray-700 text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Achievements full width */}
      <Card className="p-6">
        <h3 className="text-2xl mb-6">الإنجازات</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${achievement.earned
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200"
                    : "bg-gray-50 opacity-60"
                  }`}
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${achievement.earned
                      ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                      : "bg-gray-400"
                    }`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className={achievement.earned ? "" : "text-gray-600"}>
                    {achievement.title}
                  </p>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
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
  );
}