import { Menu, TrendingUp, Award, Target, Zap, Calendar, BookOpen, Trophy, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import type { User, StudyPlan } from '../../App';

interface AnalyticsDashboardProps {
  user: User;
  plan: StudyPlan;
  onNavigate: (page: string) => void;
  onToggleSidebar: () => void;
}

export function AnalyticsDashboard({ user, plan, onNavigate, onToggleSidebar }: AnalyticsDashboardProps) {
  const completionPercentage = plan.completionPercentage;
  const scores = Object.values(plan.quizScores);
  const averageScore = scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length 
    : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  const subjectScores = [
    { subject: 'Mathematics', score: plan.quizScores['math-1'] || 0, color: 'blue' },
    { subject: 'Physics', score: plan.quizScores['physics-1'] || 0, color: 'purple' },
    { subject: 'Chemistry', score: plan.quizScores['chem-1'] || 0, color: 'green' },
    { subject: 'English', score: plan.quizScores['english-1'] || 0, color: 'orange' },
    { subject: 'Biology', score: plan.quizScores['bio-1'] || 0, color: 'pink' }
  ];

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 75) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 60) return { label: 'Fair', color: 'text-orange-600' };
    return { label: 'Needs Improvement', color: 'text-red-600' };
  };

  const studyTips = [
    'Review modules where you scored below 70% to strengthen weak areas',
    'Maintain your study streak by completing at least one activity daily',
    'Practice more problems in subjects where you scored lowest',
    'Use the module review feature to reinforce key concepts',
    'Set aside 30 minutes daily for consistent progress'
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={onToggleSidebar} className="lg:hidden">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl">لوحة التحليلات</h1>
          <Button variant="outline" onClick={() => onNavigate('dashboard')}>
            العودة إلى لوحة التحكم
          </Button>
        </div>
      </header>

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
            <p className="text-sm text-gray-600">{plan.completedModules.length}/5 وحدات مكتملة</p>
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
              <span className="text-gray-700">الوحدات</span>
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-4xl mb-2">{plan.completedModules.length}</p>
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
            <h3 className="text-2xl mb-6">Performance by Subject</h3>
            <div className="space-y-4">
              {subjectScores.map((item) => (
                <div key={item.subject}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">{item.subject}</span>
                    <span className={item.score > 0 ? '' : 'text-gray-400'}>
                      {item.score > 0 ? `${item.score}%` : 'Not started'}
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
            <h3 className="text-2xl mb-6">Score Summary</h3>
            {scores.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Highest</p>
                    <p className="text-3xl text-green-600">{highestScore}%</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Average</p>
                    <p className="text-3xl text-blue-600">{averageScore.toFixed(0)}%</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Lowest</p>
                    <p className="text-3xl text-orange-600">{lowestScore}%</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-900">Performance Rating</span>
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
                <p>Complete modules to see your score distribution</p>
              </div>
            )}
          </Card>
        </div>

        {/* Study Recommendations */}
        <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl mb-4">AI Study Recommendations</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {studyTips.slice(0, scores.length > 0 ? 5 : 3).map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg">
                    <span className="text-blue-600 flex-shrink-0">•</span>
                    <span className="text-gray-700 text-sm">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Progress Timeline */}
        <Card className="p-6">
          <h3 className="text-2xl mb-6">Learning Timeline</h3>
          {plan.completedModules.length > 0 ? (
            <div className="space-y-4">
              {plan.completedModules.map((moduleId, index) => {
                const score = plan.quizScores[moduleId];
                const moduleNames: { [key: string]: string } = {
                  'math-1': 'Advanced Algebra',
                  'physics-1': 'Newton\'s Laws',
                  'chem-1': 'Chemical Bonding',
                  'english-1': 'Essay Writing',
                  'bio-1': 'Cell Biology'
                };
                
                return (
                  <div key={moduleId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{moduleNames[moduleId] || 'Module'}</p>
                      <p className="text-sm text-gray-600">Completed with {score}% score</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      score >= 80 
                        ? 'bg-green-100 text-green-700' 
                        : score >= 60 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Fair'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Your completed modules will appear here</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}